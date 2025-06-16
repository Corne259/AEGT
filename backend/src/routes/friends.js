const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const FriendsService = require('../services/friends');

// Get friends list
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const friends = await FriendsService.getFriendsList(req.user.id);
    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

module.exports = router;
