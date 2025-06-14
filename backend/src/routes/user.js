const express = require('express');
const databaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateTelegramWebApp, authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/user/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', auth, asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
}));

/**
 * @route GET /api/user/balance
 * @desc Get current user's token balances
 * @access Private
 */
router.get('/balance', auth, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    balance: {
      aegt: req.user.aegtBalance,
      ton: req.user.tonBalance
    }
  });
}));

/**
 * @route GET /api/user/stats
 * @desc Get user mining statistics
 * @access Private
 */
router.get('/stats', auth, asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT
      COUNT(*) as total_blocks,
      SUM(reward) as total_rewards,
      SUM(CASE WHEN is_solo THEN 1 ELSE 0 END) as solo_blocks,
      AVG(hashrate) as avg_hashrate,
      MAX(mined_at) as last_mining
    FROM mining_blocks
    WHERE user_id = $1
  `;

  const statsResult = await databaseService.query(statsQuery, [req.user.id]);
  const stats = statsResult.rows[0];

  res.json({
    success: true,
    data: {
      totalBlocks: parseInt(stats.total_blocks) || 0,
      totalRewards: stats.total_rewards || '0',
      soloBlocks: parseInt(stats.solo_blocks) || 0,
      poolBlocks: (parseInt(stats.total_blocks) || 0) - (parseInt(stats.solo_blocks) || 0),
      avgHashrate: Math.round(parseFloat(stats.avg_hashrate)) || 0,
      lastMining: stats.last_mining
    }
  });
}));

/**
 * @route GET /api/user/transactions
 * @desc Get user transaction history
 * @access Private
 */
router.get('/transactions', auth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const transactionsQuery = `
    SELECT amount, transaction_hash, type, status, created_at
    FROM ton_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM ton_transactions
    WHERE user_id = $1
  `;

  const [transactionsResult, countResult] = await Promise.all([
    databaseService.query(transactionsQuery, [req.user.id, limit, offset]),
    databaseService.query(countQuery, [req.user.id])
  ]);

  const total = parseInt(countResult.rows[0].total);

  res.json({
    success: true,
    data: {
      transactions: transactionsResult.rows.map(tx => ({
        amount: tx.amount,
        hash: tx.transaction_hash,
        type: tx.type,
        status: tx.status,
        date: tx.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

module.exports = router;
