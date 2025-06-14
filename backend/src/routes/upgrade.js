const express = require('express');
const { body, validationResult } = require('express-validator');
const databaseService = require('../services/database');
const redisService = require('../services/redis');
const logger = require('../utils/logger');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { validateTelegramWebApp, authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

// Upgrade configurations
const UPGRADES = {
  miner: [
    { level: 2, cost: 0.1, hashrate: 200, description: 'Upgrade to Level 2 Miner' },
    { level: 3, cost: 0.25, hashrate: 350, description: 'Upgrade to Level 3 Miner' },
    { level: 4, cost: 0.5, hashrate: 550, description: 'Upgrade to Level 4 Miner' },
    { level: 5, cost: 1.0, hashrate: 800, description: 'Upgrade to Level 5 Miner' },
    { level: 6, cost: 2.0, hashrate: 1200, description: 'Upgrade to Level 6 Miner' },
    { level: 7, cost: 4.0, hashrate: 1700, description: 'Upgrade to Level 7 Miner' },
    { level: 8, cost: 8.0, hashrate: 2500, description: 'Upgrade to Level 8 Miner' },
    { level: 9, cost: 15.0, hashrate: 3500, description: 'Upgrade to Level 9 Miner' },
    { level: 10, cost: 30.0, hashrate: 5000, description: 'Upgrade to Level 10 Miner (MAX)' }
  ],
  energy: [
    { level: 2, cost: 0.05, capacity: 1500, description: 'Increase Energy Capacity to 1500' },
    { level: 3, cost: 0.1, capacity: 2000, description: 'Increase Energy Capacity to 2000' },
    { level: 4, cost: 0.2, capacity: 2750, description: 'Increase Energy Capacity to 2750' },
    { level: 5, cost: 0.4, capacity: 3500, description: 'Increase Energy Capacity to 3500' },
    { level: 6, cost: 0.8, capacity: 4500, description: 'Increase Energy Capacity to 4500' },
    { level: 7, cost: 1.5, capacity: 6000, description: 'Increase Energy Capacity to 6000' },
    { level: 8, cost: 3.0, capacity: 8000, description: 'Increase Energy Capacity to 8000' },
    { level: 9, cost: 6.0, capacity: 10000, description: 'Increase Energy Capacity to 10000' },
    { level: 10, cost: 12.0, capacity: 15000, description: 'Increase Energy Capacity to 15000 (MAX)' }
  ]
};

/**
 * @route GET /api/upgrade/available
 * @desc Get available upgrades for user
 * @access Private
 */
router.get('/available', auth, asyncHandler(async (req, res) => {
  // Get user current levels
  const userQuery = `SELECT miner_level, energy_capacity FROM users WHERE id = $1`;
  const userResult = await databaseService.query(userQuery, [req.user.id]);
  const user = userResult.rows[0];
  
  const currentMinerLevel = user?.miner_level || 1;
  const currentEnergyCapacity = user?.energy_capacity || 1000;
  
  // Determine current energy level based on capacity
  let currentEnergyLevel = 1;
  for (let i = 0; i < UPGRADES.energy.length; i++) {
    if (currentEnergyCapacity >= UPGRADES.energy[i].capacity) {
      currentEnergyLevel = UPGRADES.energy[i].level;
    }
  }
  
  // Get next available upgrades
  const availableUpgrades = [];
  
  // Next miner upgrade
  if (currentMinerLevel < 10) {
    const nextMinerUpgrade = UPGRADES.miner.find(u => u.level === currentMinerLevel + 1);
    if (nextMinerUpgrade) {
      availableUpgrades.push({
        id: `miner_${nextMinerUpgrade.level}`,
        type: 'miner',
        name: `Miner Level ${nextMinerUpgrade.level}`,
        description: nextMinerUpgrade.description,
        cost: nextMinerUpgrade.cost,
        currentLevel: currentMinerLevel,
        nextLevel: nextMinerUpgrade.level,
        benefit: `+${nextMinerUpgrade.hashrate - (currentMinerLevel * 100)} H/s`,
        icon: 'cpu'
      });
    }
  }
  
  // Next energy upgrade
  if (currentEnergyLevel < 10) {
    const nextEnergyUpgrade = UPGRADES.energy.find(u => u.level === currentEnergyLevel + 1);
    if (nextEnergyUpgrade) {
      availableUpgrades.push({
        id: `energy_${nextEnergyUpgrade.level}`,
        type: 'energy',
        name: `Energy Capacity Level ${nextEnergyUpgrade.level}`,
        description: nextEnergyUpgrade.description,
        cost: nextEnergyUpgrade.cost,
        currentLevel: currentEnergyLevel,
        nextLevel: nextEnergyUpgrade.level,
        benefit: `+${nextEnergyUpgrade.capacity - currentEnergyCapacity} Energy`,
        icon: 'battery'
      });
    }
  }
  
  // Energy refill option
  availableUpgrades.push({
    id: 'energy_refill',
    type: 'refill',
    name: 'Energy Refill',
    description: 'Instantly refill your energy to maximum',
    cost: 0.01,
    benefit: 'Full Energy',
    icon: 'zap'
  });
  
  res.json({
    success: true,
    data: {
      upgrades: availableUpgrades,
      userStats: {
        minerLevel: currentMinerLevel,
        energyLevel: currentEnergyLevel,
        energyCapacity: currentEnergyCapacity,
        hashrate: currentMinerLevel * 100
      }
    }
  });
}));

/**
 * @route POST /api/upgrade/purchase
 * @desc Purchase an upgrade with TON
 * @access Private
 */
router.post('/purchase', 
  [
    body('upgradeId').notEmpty().withMessage('Upgrade ID is required'),
    body('tonAmount').isFloat({ min: 0 }).withMessage('Valid TON amount required'),
    body('transactionHash').optional().isString().withMessage('Transaction hash must be string')
  ],
  auth, 
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { upgradeId, tonAmount, transactionHash } = req.body;
    
    // Parse upgrade ID
    const [upgradeType, upgradeLevel] = upgradeId.split('_');
    
    // Get user current data
    const userQuery = `SELECT miner_level, energy_capacity, aegt_balance FROM users WHERE id = $1`;
    const userResult = await databaseService.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];
    
    let upgrade;
    let updateQuery;
    let updateParams;
    
    if (upgradeType === 'miner') {
      const level = parseInt(upgradeLevel);
      upgrade = UPGRADES.miner.find(u => u.level === level);
      
      if (!upgrade || user.miner_level >= level) {
        return res.status(400).json({
          error: 'Invalid miner upgrade',
          code: 'INVALID_UPGRADE'
        });
      }
      
      if (tonAmount < upgrade.cost) {
        return res.status(400).json({
          error: `Insufficient TON. Required: ${upgrade.cost} TON`,
          code: 'INSUFFICIENT_PAYMENT'
        });
      }
      
      updateQuery = `UPDATE users SET miner_level = $1 WHERE id = $2`;
      updateParams = [level, req.user.id];
      
    } else if (upgradeType === 'energy') {
      const level = parseInt(upgradeLevel);
      upgrade = UPGRADES.energy.find(u => u.level === level);
      
      if (!upgrade || user.energy_capacity >= upgrade.capacity) {
        return res.status(400).json({
          error: 'Invalid energy upgrade',
          code: 'INVALID_UPGRADE'
        });
      }
      
      if (tonAmount < upgrade.cost) {
        return res.status(400).json({
          error: `Insufficient TON. Required: ${upgrade.cost} TON`,
          code: 'INSUFFICIENT_PAYMENT'
        });
      }
      
      updateQuery = `UPDATE users SET energy_capacity = $1 WHERE id = $2`;
      updateParams = [upgrade.capacity, req.user.id];
      
      // Update energy state in Redis
      const energyState = await redisService.getUserEnergyState(req.user.id);
      await redisService.setUserEnergyState(req.user.id, {
        ...energyState,
        max: upgrade.capacity,
        current: Math.min(energyState.current || 1000, upgrade.capacity)
      });
      
    } else if (upgradeType === 'energy' && upgradeLevel === 'refill') {
      if (tonAmount < 0.01) {
        return res.status(400).json({
          error: 'Insufficient TON. Required: 0.01 TON',
          code: 'INSUFFICIENT_PAYMENT'
        });
      }
      
      // Refill energy
      await redisService.setUserEnergyState(req.user.id, {
        current: user.energy_capacity,
        max: user.energy_capacity,
        regenRate: 250,
        lastUpdate: Date.now()
      });
      
      // Record transaction
      await databaseService.query(
        `INSERT INTO ton_transactions (user_id, amount, transaction_hash, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [req.user.id, tonAmount, transactionHash || 'manual', 'energy_refill', 'completed']
      );
      
      logger.info('Energy refill purchased', {
        userId: req.user.id,
        tonAmount,
        transactionHash
      });
      
      return res.json({
        success: true,
        message: 'Energy refilled successfully!',
        data: {
          type: 'energy_refill',
          energyCurrent: user.energy_capacity,
          energyMax: user.energy_capacity
        }
      });
    }
    
    if (upgrade && updateQuery) {
      // Apply upgrade
      await databaseService.query(updateQuery, updateParams);
      
      // Record transaction
      await databaseService.query(
        `INSERT INTO ton_transactions (user_id, amount, transaction_hash, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [req.user.id, tonAmount, transactionHash || 'manual', upgradeType, 'completed']
      );
      
      logger.info('Upgrade purchased', {
        userId: req.user.id,
        upgradeType,
        upgradeLevel,
        tonAmount,
        transactionHash
      });
      
      res.json({
        success: true,
        message: `${upgrade.description} completed!`,
        data: {
          type: upgradeType,
          level: upgradeType === 'miner' ? upgrade.level : upgrade.level,
          newValue: upgradeType === 'miner' ? upgrade.hashrate : upgrade.capacity
        }
      });
    } else {
      res.status(400).json({
        error: 'Invalid upgrade type',
        code: 'INVALID_UPGRADE_TYPE'
      });
    }
  })
);

/**
 * @route GET /api/upgrade/history
 * @desc Get user's upgrade history
 * @access Private
 */
router.get('/history', auth, asyncHandler(async (req, res) => {
  const query = `
    SELECT amount, transaction_hash, type, status, created_at
    FROM ton_transactions
    WHERE user_id = $1 AND type IN ('miner', 'energy', 'energy_refill')
    ORDER BY created_at DESC
    LIMIT 50
  `;
  
  const result = await databaseService.query(query, [req.user.id]);
  
  res.json({
    success: true,
    data: {
      transactions: result.rows.map(tx => ({
        amount: tx.amount,
        hash: tx.transaction_hash,
        type: tx.type,
        status: tx.status,
        date: tx.created_at
      }))
    }
  });
}));

module.exports = router;