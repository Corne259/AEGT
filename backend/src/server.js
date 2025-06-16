const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import utilities and middleware
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const miningRoutes = require('./routes/mining');
const upgradeRoutes = require('./routes/upgrade');
const energyRoutes = require('./routes/energy');
const tonRoutes = require('./routes/ton');
const friendsRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');

// Import services
const databaseService = require('./services/database');
const redisService = require('./services/redis');
const miningService = require('./services/mining');

const app = express();
const PORT = process.env.PORT || 3001; // Match NGINX
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - ALLOW ALL ORIGINS FOR PRODUCTION
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Rate limiting DISABLED for production testing
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100000,
//   message: { error: 'Too many requests from this IP, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/mining', authMiddleware, miningRoutes);
app.use('/api/upgrades', authMiddleware, upgradeRoutes);
app.use('/api/energy', authMiddleware, energyRoutes);
app.use('/api/ton', authMiddleware, tonRoutes);
app.use('/api/friends', authMiddleware, friendsRoutes);
app.use('/api/admin', adminRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.use(errorHandler);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

module.exports = app;
