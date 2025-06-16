module.exports = {
  apps: [{
    name: 'aegisum-backend',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0',
      
      // Database - CORRECT PASSWORD
      DATABASE_URL: 'postgresql://aegisum_user:aegisum_secure_password_2025@localhost:5432/aegisum_db',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'aegisum_db',
      DB_USER: 'aegisum_user',
      DB_PASSWORD: 'aegisum_secure_password_2025',
      
      // Redis
      REDIS_URL: 'redis://localhost:6379',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      
      // JWT
      JWT_SECRET: 'aegisum_super_secret_jwt_key_2025_production_secure_long_string_12345',
      JWT_REFRESH_SECRET: 'aegisum_refresh_secret_different_from_access_token_67890_secure',
      JWT_EXPIRES_IN: '7d',
      JWT_REFRESH_EXPIRES_IN: '30d',
      
      // CORS
      CORS_ORIGIN: 'https://webapp.aegisum.co.za,http://localhost:3000',
      CORS_CREDENTIALS: 'true',
      
      // Telegram Bot
      TELEGRAM_BOT_TOKEN: '7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s',
      
      // Mining
      MINING_BLOCK_TIME: 180,
      MINING_BASE_REWARD: 1000000000,
      
      // Energy
      ENERGY_REGEN_RATE: 250,
      ENERGY_MAX_CAPACITY: 10000
    },
    error_file: '/home/daimond/AEGT/logs/backend-error.log',
    out_file: '/home/daimond/AEGT/logs/backend-out.log',
    log_file: '/home/daimond/AEGT/logs/backend-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
