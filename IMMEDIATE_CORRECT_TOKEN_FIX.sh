#!/bin/bash

echo "🚨 IMMEDIATE FIX - Using CORRECT bot token!"
echo "============================================"

# 1. Fix the .env file with CORRECT bot token
cat > /home/daimond/AEGT/backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aegisum_db
DB_USER=aegisum_user
DB_PASSWORD=aegisum_secure_password_2024
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secure_jwt_secret_key_2024_aegisum
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret_key_2024_aegisum
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
TELEGRAM_BOT_TOKEN=7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s
ADMIN_TELEGRAM_ID=1651155083
CORS_ORIGIN=http://webapp.aegisum.co.za,https://webapp.aegisum.co.za,http://209.209.40.62
EOF

# 2. Fix bot.js with CORRECT token
cat > /home/daimond/AEGT/backend/src/bot.js << 'EOF'
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');

// CORRECT bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '1651155083';

let bot = null;
let databaseService = null;

const initializeBot = () => {
  try {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });
    
    // Get database service
    databaseService = require('./services/database');
    
    // Bot commands
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      try {
        if (databaseService && databaseService.isConnected) {
          const userQuery = 'SELECT * FROM users WHERE telegram_id = $1';
          const result = await databaseService.query(userQuery, [userId]);
          
          if (result.rows.length === 0) {
            const insertQuery = `
              INSERT INTO users (telegram_id, username, first_name, last_name, aegt_balance, ton_balance, miner_level, energy_capacity, created_at, updated_at, is_active)
              VALUES ($1, $2, $3, $4, 0, 0, 1, 1000, NOW(), NOW(), true)
              RETURNING id
            `;
            await databaseService.query(insertQuery, [
              userId,
              msg.from.username || null,
              msg.from.first_name || null,
              msg.from.last_name || null
            ]);
            logger.info('New user created via bot', { userId, telegramId: userId });
          }
        }
        
        const welcomeMessage = `
🎮 Welcome to AEGISUM TON Miner!

🌐 Web App: http://webapp.aegisum.co.za
⚡ Start mining AEGT tokens now!

Commands:
/stats - View statistics
/help - Show help
/admin - Admin panel (admin only)
        `;
        
        bot.sendMessage(chatId, welcomeMessage);
      } catch (error) {
        logger.error('Bot start error:', error);
        bot.sendMessage(chatId, '🎮 Welcome to AEGISUM TON Miner!\n\n🌐 Web App: http://webapp.aegisum.co.za\n⚡ Start mining now!');
      }
    });

    bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        if (databaseService && databaseService.isConnected) {
          const userCountQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
          const userResult = await databaseService.query(userCountQuery);
          
          const blockCountQuery = 'SELECT COUNT(*) as total FROM mining_history';
          const blockResult = await databaseService.query(blockCountQuery);
          
          const totalRewardsQuery = 'SELECT SUM(reward_amount) as total FROM mining_history';
          const rewardsResult = await databaseService.query(totalRewardsQuery);
          
          const statsMessage = `
📊 AEGISUM Statistics

👥 Users: ${userResult.rows[0].total}
⛏️ Blocks Mined: ${blockResult.rows[0].total || 0}
💰 Total Rewards: ${parseFloat(rewardsResult.rows[0].total || 0).toFixed(2)} AEGT
🌐 Web App: http://webapp.aegisum.co.za
          `;
          
          bot.sendMessage(chatId, statsMessage);
        } else {
          bot.sendMessage(chatId, '📊 AEGISUM Statistics\n\n🌐 Web App: http://webapp.aegisum.co.za\n⚡ Mining system active!');
        }
      } catch (error) {
        logger.error('Bot stats error:', error);
        bot.sendMessage(chatId, '📊 AEGISUM Statistics\n\n🌐 Web App: http://webapp.aegisum.co.za\n⚡ Mining system active!');
      }
    });

    bot.onText(/\/admin/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      
      if (userId !== ADMIN_ID) {
        bot.sendMessage(chatId, '❌ Access denied. Admin only.');
        return;
      }
      
      try {
        if (databaseService && databaseService.isConnected) {
          const userCountQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
          const userResult = await databaseService.query(userCountQuery);
          
          const blockCountQuery = 'SELECT COUNT(*) as total FROM mining_history';
          const blockResult = await databaseService.query(blockCountQuery);
          
          const adminMessage = `
🛠️ Admin Panel - System Status

👥 Users: ${userResult.rows[0].total}
⛏️ Blocks Mined: ${blockResult.rows[0].total || 0}
🌐 Web App: http://webapp.aegisum.co.za
✅ System Online

Commands:
/users - List users
/broadcast <message> - Send broadcast
/help - Show all commands
          `;
          
          bot.sendMessage(chatId, adminMessage);
        } else {
          bot.sendMessage(chatId, '🛠️ Admin Panel\n\n🌐 Web App: http://webapp.aegisum.co.za\n✅ System Online');
        }
      } catch (error) {
        logger.error('Bot admin error:', error);
        bot.sendMessage(chatId, '🛠️ Admin Panel\n\n🌐 Web App: http://webapp.aegisum.co.za\n✅ System Online');
      }
    });

    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      
      let helpMessage = `
🎮 AEGISUM TON Miner Commands

🌐 /start - Start mining
📊 /stats - View statistics
❓ /help - Show this help

🌐 Web App: http://webapp.aegisum.co.za
      `;
      
      if (userId === ADMIN_ID) {
        helpMessage += `
🛠️ Admin Commands:
/admin - Admin panel
/users - List users
/broadcast <msg> - Send broadcast
        `;
      }
      
      bot.sendMessage(chatId, helpMessage);
    });

    bot.on('error', (error) => {
      logger.error('Telegram bot error:', error);
    });

    bot.on('polling_error', (error) => {
      logger.error('Telegram bot polling error:', error);
    });

    logger.info('Telegram bot started with CORRECT token');
    
  } catch (error) {
    logger.error('Failed to initialize bot:', error);
  }
};

// Initialize bot after delay
setTimeout(initializeBot, 3000);

module.exports = { initializeBot };
EOF

echo "✅ CORRECT bot token applied: 7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s"
echo "✅ Admin ID: 1651155083"
echo "✅ Files updated with correct credentials"

echo ""
echo "🚀 NOW RUN THESE COMMANDS:"
echo "cd /home/daimond/AEGT/backend"
echo "NODE_ENV=production node src/server.js"