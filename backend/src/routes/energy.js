const express = require('express');
const miningService = require('../services/mining');
const redisService = require('../services/redis');
const databaseService = require('../services/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateTelegramWebApp, authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

router.get('/status', auth, asyncHandler(async (req, res) => {
  // Get user data for energy capacity
  const userQuery = `SELECT energy_capacity, miner_level FROM users WHERE id = $1`;
  const userResult = await databaseService.query(userQuery, [req.user.id]);
  const user = userResult.rows[0];
  
  const energyState = await redisService.getUserEnergyState(req.user.id);
  
  // Initialize energy state if not exists
  if (!energyState.max) {
    const initialState = {
      current: user?.energy_capacity || 1000,
      max: user?.energy_capacity || 1000,
      regenRate: 250,
      lastUpdate: Date.now()
    };
    await redisService.setUserEnergyState(req.user.id, initialState);
    
    return res.json({
      success: true,
      data: initialState
    });
  }
  
  const currentEnergy = await miningService.calculateCurrentEnergy(req.user.id, energyState);
  
  res.json({
    success: true,
    data: {
      current: Math.floor(currentEnergy),
      max: energyState.max || user?.energy_capacity || 1000,
      regenRate: energyState.regenRate || 250,
      lastUpdate: energyState.lastUpdate
    }
  });
}));

router.post('/refill', auth, asyncHandler(async (req, res) => {
  // Get user data
  const userQuery = `SELECT energy_capacity FROM users WHERE id = $1`;
  const userResult = await databaseService.query(userQuery, [req.user.id]);
  const user = userResult.rows[0];
  
  // Refill energy to maximum
  await redisService.setUserEnergyState(req.user.id, {
    current: user?.energy_capacity || 1000,
    max: user?.energy_capacity || 1000,
    regenRate: 250,
    lastUpdate: Date.now()
  });
  
  res.json({ 
    success: true, 
    message: 'Energy refilled to maximum',
    data: {
      current: user?.energy_capacity || 1000,
      max: user?.energy_capacity || 1000
    }
  });
}));

module.exports = router;