const express = require('express');
const { body, query, validationResult } = require('express-validator');
const databaseService = require('../services/database');
const logger = require('../utils/logger');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/friends/referral-code
 * @desc Get user's referral code
 * @access Private
 */
router.get('/referral-code', auth, asyncHandler(async (req, res) => {
  // Generate referral code if user doesn't have one
  let referralCode = req.user.referralCode;
  
  if (!referralCode) {
    // Generate a unique referral code
    referralCode = `AEGT${req.user.telegramId}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Update user with referral code
    await databaseService.query(
      'UPDATE users SET referral_code = $1 WHERE id = $2',
      [referralCode, req.user.id]
    );
  }

  res.json({
    success: true,
    data: {
      referralCode,
      referralLink: `https://t.me/aegisum_bot?start=${referralCode}`
    }
  });
}));

/**
 * @route POST /api/friends/use-referral
 * @desc Use a referral code
 * @access Private
 */
router.post('/use-referral',
  [
    body('referralCode').notEmpty().withMessage('Referral code is required')
  ],
  auth,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { referralCode } = req.body;

    // Check if user already used a referral code
    if (req.user.referredBy) {
      return res.status(400).json({
        error: 'You have already used a referral code',
        code: 'ALREADY_REFERRED'
      });
    }

    // Find the referrer
    const referrerQuery = `
      SELECT id, username, first_name, referral_code
      FROM users 
      WHERE referral_code = $1 AND id != $2
    `;
    
    const referrerResult = await databaseService.query(referrerQuery, [referralCode, req.user.id]);
    
    if (referrerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Invalid referral code',
        code: 'INVALID_REFERRAL'
      });
    }

    const referrer = referrerResult.rows[0];

    // Update user with referrer
    await databaseService.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [referrer.id, req.user.id]
    );

    // Give bonus to both users
    const referrerBonus = 50000000; // 0.05 AEGT
    const refereeBonus = 25000000;  // 0.025 AEGT

    await databaseService.query(
      'UPDATE users SET aegt_balance = aegt_balance + $1 WHERE id = $2',
      [referrerBonus, referrer.id]
    );

    await databaseService.query(
      'UPDATE users SET aegt_balance = aegt_balance + $1 WHERE id = $2',
      [refereeBonus, req.user.id]
    );

    // Record the referral
    await databaseService.query(
      `INSERT INTO referrals (referrer_id, referee_id, bonus_amount, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [referrer.id, req.user.id, referrerBonus]
    );

    logger.info('Referral used', {
      referrerId: referrer.id,
      refereeId: req.user.id,
      referralCode,
      referrerBonus,
      refereeBonus
    });

    res.json({
      success: true,
      message: `Welcome! You and ${referrer.first_name} both received bonus AEGT!`,
      data: {
        referrer: {
          username: referrer.username,
          firstName: referrer.first_name
        },
        bonusReceived: refereeBonus
      }
    });
  })
);

/**
 * @route GET /api/friends/list
 * @desc Get user's referred friends
 * @access Private
 */
router.get('/list', auth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const friendsQuery = `
    SELECT 
      u.username, u.first_name, u.miner_level, u.created_at,
      COALESCE(mb.total_blocks, 0) as total_blocks,
      COALESCE(mb.total_rewards, 0) as total_rewards,
      r.bonus_amount, r.created_at as referred_at
    FROM users u
    JOIN referrals r ON u.id = r.referee_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_blocks,
        SUM(reward) as total_rewards
      FROM mining_blocks
      GROUP BY user_id
    ) mb ON u.id = mb.user_id
    WHERE r.referrer_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM referrals
    WHERE referrer_id = $1
  `;

  const [friendsResult, countResult] = await Promise.all([
    databaseService.query(friendsQuery, [req.user.id, limit, offset]),
    databaseService.query(countQuery, [req.user.id])
  ]);

  const total = parseInt(countResult.rows[0].total);

  // Get referral stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_referrals,
      SUM(bonus_amount) as total_bonuses
    FROM referrals
    WHERE referrer_id = $1
  `;

  const statsResult = await databaseService.query(statsQuery, [req.user.id]);
  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      friends: friendsResult.rows.map(friend => ({
        username: friend.username || 'Anonymous',
        firstName: friend.first_name,
        minerLevel: friend.miner_level,
        totalBlocks: parseInt(friend.total_blocks) || 0,
        totalRewards: friend.total_rewards || '0',
        bonusEarned: friend.bonus_amount,
        joinedAt: friend.referred_at,
        registeredAt: friend.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalReferrals: parseInt(stats.total_referrals) || 0,
        totalBonuses: stats.total_bonuses || '0'
      }
    }
  });
}));

/**
 * @route GET /api/friends/leaderboard
 * @desc Get referral leaderboard
 * @access Private
 */
router.get('/leaderboard', auth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const leaderboardQuery = `
    SELECT 
      u.username, u.first_name, u.miner_level,
      COUNT(r.referee_id) as total_referrals,
      SUM(r.bonus_amount) as total_bonuses
    FROM users u
    LEFT JOIN referrals r ON u.id = r.referrer_id
    WHERE u.is_active = true
    GROUP BY u.id, u.username, u.first_name, u.miner_level
    HAVING COUNT(r.referee_id) > 0
    ORDER BY total_referrals DESC, total_bonuses DESC
    LIMIT $1
  `;

  const result = await databaseService.query(leaderboardQuery, [limit]);

  res.json({
    success: true,
    data: {
      leaderboard: result.rows.map((entry, index) => ({
        rank: index + 1,
        username: entry.username || 'Anonymous',
        firstName: entry.first_name,
        minerLevel: entry.miner_level,
        totalReferrals: parseInt(entry.total_referrals) || 0,
        totalBonuses: entry.total_bonuses || '0'
      }))
    }
  });
}));

module.exports = router;