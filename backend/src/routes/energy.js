const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EnergyService = require('../services/energy');

// Get energy status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await EnergyService.getEnergyStatus(req.user.id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;
