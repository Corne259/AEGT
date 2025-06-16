const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UpgradeService = require('../services/upgrade');

// Get available upgrades
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const upgrades = await UpgradeService.getAvailableUpgrades(req.user.id);
    res.json({
      success: true,
      data: upgrades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;
