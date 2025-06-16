const express = require('express');
const { adminAuth } = require('../middleware/auth');
const db = require('../services/database');
const router = express.Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Get user stats
    const userStatsQuery = 'SELECT COUNT(*) as total_users FROM users';
    const userStats = await db.query(userStatsQuery);
    
    // Get mining stats
    const miningStatsQuery = `
      SELECT 
        COUNT(DISTINCT user_id) as current_active_miners,
        COUNT(*) as total_blocks_24h
      FROM mining_blocks 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;
    const miningStats = await db.query(miningStatsQuery);
    
    // Get revenue stats
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_ton
      FROM ton_transactions 
      WHERE status = 'completed'
    `;
    const revenueStats = await db.query(revenueQuery);
    
    const dashboardData = {
      users: {
        total_users: parseInt(userStats.rows[0]?.total_users || 0)
      },
      mining: {
        currentActiveMiners: parseInt(miningStats.rows[0]?.current_active_miners || 0),
        total_blocks_24h: parseInt(miningStats.rows[0]?.total_blocks_24h || 0)
      },
      revenue: {
        total_ton: parseFloat(revenueStats.rows[0]?.total_ton || 0)
      }
    };
    
    res.json({ 
      success: true, 
      data: dashboardData 
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
});

// System reset endpoint
router.post('/system/reset', async (req, res) => {
  try {
    // Delete all data in correct order (respecting foreign keys)
    await db.query('DELETE FROM mining_blocks');
    await db.query('DELETE FROM active_mining');
    await db.query('DELETE FROM ton_transactions');
    await db.query('DELETE FROM energy_refills');
    await db.query('DELETE FROM user_upgrades');
    await db.query('DELETE FROM referrals');
    await db.query('DELETE FROM wallet_auth_sessions');
    await db.query('DELETE FROM user_tokens');
    await db.query('DELETE FROM users');
    
    // Reset sequences
    await db.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await db.query('ALTER SEQUENCE mining_blocks_id_seq RESTART WITH 1');
    
    res.json({ 
      success: true, 
      message: 'System reset successfully' 
    });
  } catch (error) {
    console.error('System reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset system' 
    });
  }
});

router.get('/stats', (req, res) => {
  res.json({ success: true, stats: {} });
});

router.get('/users', (req, res) => {
  res.json({ success: true, users: [] });
});

module.exports = router;