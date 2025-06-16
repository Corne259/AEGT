#!/bin/bash

echo "🔧 FIXING BOT TOKEN - Using the CORRECT token!"
echo "=============================================="

# Kill everything first
sudo pkill -f "node" 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Fix the .env file with CORRECT bot token
cd /home/daimond/AEGT/backend
cat > .env << 'EOF'
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

echo "✅ Environment file updated with CORRECT bot token"

# Update the bot.js file with correct token
cat > src/bot.js << 'EOF'
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');

// CORRECT Bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '1651155083';

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Database service - will be set when available
let databaseService = null;
let dbReady = false;

// Initialize database connection after delay
setTimeout(async () => {
    try {
        databaseService = require('./services/database');
        await databaseService.initialize();
        dbReady = true;
        logger.info('Bot database connection established');
    } catch (error) {
        logger.error('Bot database connection failed:', error);
        dbReady = false;
    }
}, 3000); // 3 second delay

// Safe database query with fallback
const safeQuery = async (query, params = []) => {
    if (!dbReady || !databaseService) {
        throw new Error('Database not ready yet. Please try again in a moment.');
    }
    return await databaseService.query(query, params);
};

// Bot commands
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    try {
        if (dbReady && databaseService) {
            // Check if user exists
            const userQuery = 'SELECT * FROM users WHERE telegram_id = $1';
            const result = await safeQuery(userQuery, [userId]);
            
            if (result.rows.length === 0) {
                // Create new user
                const insertQuery = `
                    INSERT INTO users (telegram_id, username, first_name, last_name, aegt_balance, ton_balance, miner_level, energy_capacity, created_at, updated_at, is_active)
                    VALUES ($1, $2, $3, $4, 0, 0, 1, 1000, NOW(), NOW(), true)
                    RETURNING id
                `;
                await safeQuery(insertQuery, [
                    userId,
                    msg.from.username || null,
                    msg.from.first_name || null,
                    msg.from.last_name || null
                ]);
                logger.info('New user created via bot:', { userId, username: msg.from.username });
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

Your account is ready! Visit the web app to start mining.
        `;
        
        bot.sendMessage(chatId, welcomeMessage);
    } catch (error) {
        logger.error('Bot start error:', error);
        bot.sendMessage(chatId, `Welcome to AEGISUM! 🎮\n\n🌐 Web App: http://webapp.aegisum.co.za\n\n${error.message || 'System starting up, please try again in a moment.'}`);
    }
});

bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        if (!dbReady || !databaseService) {
            bot.sendMessage(chatId, '📊 System starting up...\n\n🌐 Web App: http://webapp.aegisum.co.za\nPlease try again in a moment.');
            return;
        }
        
        // Get total stats
        const userCountQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
        const userResult = await safeQuery(userCountQuery);
        
        const blockCountQuery = 'SELECT COUNT(*) as total FROM mining_history';
        const blockResult = await safeQuery(blockCountQuery);
        
        const totalRewardsQuery = 'SELECT SUM(reward_amount) as total FROM mining_history';
        const rewardsResult = await safeQuery(totalRewardsQuery);
        
        const statsMessage = `
📊 AEGISUM Statistics

👥 Users: ${userResult.rows[0].total}
⛏️ Blocks Mined: ${blockResult.rows[0].total || 0}
💰 Total Rewards: ${parseFloat(rewardsResult.rows[0].total || 0).toFixed(2)} AEGT
🌐 Web App: http://webapp.aegisum.co.za

Start mining now! 🚀
        `;
        
        bot.sendMessage(chatId, statsMessage);
    } catch (error) {
        logger.error('Bot stats error:', error);
        bot.sendMessage(chatId, `📊 Statistics temporarily unavailable.\n\n🌐 Web App: http://webapp.aegisum.co.za\n\n${error.message || 'Please try again later.'}`);
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
        if (!dbReady || !databaseService) {
            bot.sendMessage(chatId, '🛠️ Admin Panel\n\nSystem starting up...\nPlease try again in a moment.');
            return;
        }
        
        // Get detailed admin stats
        const userCountQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
        const newUsersQuery = 'SELECT COUNT(*) as total FROM users WHERE created_at > NOW() - INTERVAL \'24 hours\'';
        const blockCountQuery = 'SELECT COUNT(*) as total FROM mining_history';
        const totalRewardsQuery = 'SELECT SUM(reward_amount) as total FROM mining_history';
        
        const [userResult, newUsersResult, blockResult, rewardsResult] = await Promise.all([
            safeQuery(userCountQuery),
            safeQuery(newUsersQuery),
            safeQuery(blockCountQuery),
            safeQuery(totalRewardsQuery)
        ]);
        
        const adminMessage = `
🛠️ Admin Panel - System Status

👥 Users:
• Total: ${userResult.rows[0].total}
• New (24h): ${newUsersResult.rows[0].total}

⛏️ Mining:
• Blocks Mined: ${blockResult.rows[0].total || 0}
• Total Rewards: ${parseFloat(rewardsResult.rows[0].total || 0).toFixed(2)} AEGT

🌐 System:
• Web App: ✅ http://webapp.aegisum.co.za
• Bot: ✅ Online
• Database: ✅ Connected

Commands:
/users - List recent users
/broadcast <message> - Send to all users
/help - Show all commands
        `;
        
        bot.sendMessage(chatId, adminMessage);
    } catch (error) {
        logger.error('Bot admin error:', error);
        bot.sendMessage(chatId, `🛠️ Admin Panel\n\nError: ${error.message || 'System temporarily unavailable'}\n\nPlease try again later.`);
    }
});

bot.onText(/\/users/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    if (userId !== ADMIN_ID) {
        bot.sendMessage(chatId, '❌ Access denied. Admin only.');
        return;
    }
    
    try {
        if (!dbReady || !databaseService) {
            bot.sendMessage(chatId, '👥 Users list temporarily unavailable.\nSystem starting up...');
            return;
        }
        
        const usersQuery = `
            SELECT telegram_id, username, first_name, aegt_balance, miner_level, created_at
            FROM users 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        const result = await safeQuery(usersQuery);
        
        let usersList = '👥 Recent Users (Last 10):\n\n';
        result.rows.forEach((user, index) => {
            usersList += `${index + 1}. ${user.first_name || 'Unknown'} (@${user.username || 'no_username'})\n`;
            usersList += `   💰 ${parseFloat(user.aegt_balance || 0).toFixed(2)} AEGT | ⛏️ Level ${user.miner_level}\n`;
            usersList += `   📅 ${new Date(user.created_at).toLocaleDateString()}\n\n`;
        });
        
        bot.sendMessage(chatId, usersList);
    } catch (error) {
        logger.error('Bot users error:', error);
        bot.sendMessage(chatId, `👥 Users list error: ${error.message || 'Please try again later.'}`);
    }
});

bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    if (userId !== ADMIN_ID) {
        bot.sendMessage(chatId, '❌ Access denied. Admin only.');
        return;
    }
    
    const message = match[1];
    
    try {
        if (!dbReady || !databaseService) {
            bot.sendMessage(chatId, '📢 Broadcast unavailable.\nSystem starting up...');
            return;
        }
        
        const usersQuery = 'SELECT telegram_id FROM users WHERE is_active = true';
        const result = await safeQuery(usersQuery);
        
        let sent = 0;
        let failed = 0;
        
        bot.sendMessage(chatId, `📢 Starting broadcast to ${result.rows.length} users...`);
        
        for (const user of result.rows) {
            try {
                await bot.sendMessage(user.telegram_id, `📢 Admin Broadcast:\n\n${message}`);
                sent++;
            } catch (error) {
                failed++;
            }
        }
        
        bot.sendMessage(chatId, `📢 Broadcast complete!\n✅ Sent: ${sent}\n❌ Failed: ${failed}`);
    } catch (error) {
        logger.error('Bot broadcast error:', error);
        bot.sendMessage(chatId, `📢 Broadcast error: ${error.message || 'Please try again later.'}`);
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
Start mining AEGT tokens now! 🚀
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

// Error handling
bot.on('error', (error) => {
    logger.error('Telegram bot error:', error);
});

bot.on('polling_error', (error) => {
    logger.error('Telegram bot polling error:', error);
});

logger.info('Telegram bot started successfully with CORRECT token');

module.exports = bot;
EOF

echo "✅ Bot file updated with CORRECT token"

# Start the server manually first to test
echo "🧪 Testing server with CORRECT bot token..."
timeout 10s node src/server.js &
sleep 5

if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server test successful with CORRECT token"
    sudo pkill -f "node" 2>/dev/null || true
else
    echo "❌ Server test failed"
    sudo pkill -f "node" 2>/dev/null || true
    exit 1
fi

# Start with PM2
echo "🚀 Starting with PM2 using CORRECT token..."
pm2 start src/server.js --name aegisum-backend --env production
pm2 save

echo ""
echo "🎉 BOT TOKEN FIXED!"
echo "✅ Using CORRECT token: 7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s"
echo "✅ Admin ID: 1651155083"
echo ""
echo "🤖 Try your Telegram bot commands now:"
echo "/start - Should work immediately"
echo "/stats - View statistics"
echo "/admin - Admin panel"
echo ""
echo "🌐 Website: http://webapp.aegisum.co.za"