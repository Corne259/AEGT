const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const DatabaseService = require('../services/database');

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.telegramId !== '1651155083') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get admin dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await DatabaseService.query('SELECT COUNT(*) as total_users FROM users');
    const mining = await DatabaseService.query('SELECT COUNT(*) as active_miners FROM active_mining');
    const blocks = await DatabaseService.query('SELECT COUNT(*) as total_blocks FROM mining_blocks');

    res.json({
      success: true,
      data: {
        users: users.rows[0],
        mining: {
          currentActiveMiners: mining.rows[0].active_miners,
          total_blocks: blocks.rows[0].total_blocks || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
