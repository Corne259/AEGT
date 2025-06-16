const express = require('express');
const cors = require('cors');
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
const authRoutes = require('./routes/auth');
const miningRoutes = require('./routes/mining');
const upgradeRoutes = require('./routes/upgrade');
const energyRoutes = require('./routes/energy');
const friendsRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
