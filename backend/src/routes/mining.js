const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const MiningService = require('../services/mining');
const logger = require('../utils/logger');

// Start mining
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const result = await MiningService.startMining(req.user.id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Mining started successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Failed to start mining'
      });
    }
  } catch (error) {
    logger.error('Mining start error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

// Get mining status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await MiningService.getMiningStatus(req.user.id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Mining status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;
