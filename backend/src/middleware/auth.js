const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/database');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_REQUIRED' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await DatabaseService.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }

    req.user = {
      id: result.rows[0].id,
      telegramId: result.rows[0].telegram_id,
      username: result.rows[0].username,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN' 
    });
  }
};

module.exports = {
  authenticateToken
};
