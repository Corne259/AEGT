const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const DatabaseService = require('../services/database');

// Admin middleware - check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.telegram_id !== '1651155083') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get admin dashboard data
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users, mining, blocks] = await Promise.all([
      DatabaseService.query('SELECT COUNT(*) as total_users FROM users WHERE is_active = true'),
      DatabaseService.query('SELECT COUNT(*) as active_miners FROM active_mining'),
      DatabaseService.query('SELECT COUNT(*) as total_blocks, SUM(reward) as total_rewards FROM mining_blocks')
    ]);

    res.json({
      success: true,
      data: {
        users: users.rows[0],
        mining: {
          currentActiveMiners: mining.rows[0].active_miners,
          total_blocks: blocks.rows[0].total_blocks || 0,
          total_rewards: blocks.rows[0].total_rewards || 0
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update system configuration
router.post('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    await DatabaseService.query(
      'INSERT INTO system_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2',
      [key, value]
    );

    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Reset system data
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await DatabaseService.query('DELETE FROM mining_blocks');
    await DatabaseService.query('DELETE FROM active_mining');
    await DatabaseService.query('DELETE FROM referrals');
    await DatabaseService.query('UPDATE system_config SET config_value = \'0\' WHERE config_key = \'total_blocks_mined\'');

    res.json({ success: true, message: 'System reset successfully' });
  } catch (error) {
    console.error('System reset error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
