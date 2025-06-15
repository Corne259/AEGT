import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Zap, 
  Users, 
  Trophy,
  Clock,
  Coins,
  Activity,
  Target,
  Calendar,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Stats.css';

const Stats = () => {
  const [userStats, setUserStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [miningHistory, setMiningHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      await Promise.all([
        fetchUserStats(),
        fetchGlobalStats(),
        fetchMiningHistory(),
        fetchLeaderboard()
      ]);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/mining/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGlobalStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    }
  };

  const fetchMiningHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/mining/history?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMiningHistory(data.data.blocks || []);
      }
    } catch (error) {
      console.error('Failed to fetch mining history:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/mining/leaderboard?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const formatAEGT = (amount) => {
    return (parseInt(amount) / 1000000000).toFixed(3);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const formatHashrate = (hashrate) => {
    if (hashrate >= 1000000) {
      return `${(hashrate / 1000000).toFixed(1)}MH/s`;
    } else if (hashrate >= 1000) {
      return `${(hashrate / 1000).toFixed(1)}KH/s`;
    }
    return `${hashrate}H/s`;
  };

  if (loading) {
    return (
      <div className="stats-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div className="header-icon">
          <BarChart3 size={32} />
        </div>
        <h1>Statistics</h1>
        <p>Track your mining performance and progress</p>
      </div>

      <div className="stats-tabs">
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <Activity size={20} />
          Personal
        </button>
        <button 
          className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          <Users size={20} />
          Global
        </button>
        <button 
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={20} />
          Leaderboard
        </button>
      </div>

      <div className="stats-content">
        {activeTab === 'personal' && userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="personal-stats"
          >
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <Coins size={24} />
                </div>
                <div className="stat-info">
                  <h3>Total Rewards</h3>
                  <p className="stat-value">{formatAEGT(userStats.totalRewards)} AEGT</p>
                </div>
              </div>

              <div className="stat-card secondary">
                <div className="stat-icon">
                  <Hash size={24} />
                </div>
                <div className="stat-info">
                  <h3>Blocks Mined</h3>
                  <p className="stat-value">{userStats.totalBlocks}</p>
                </div>
              </div>

              <div className="stat-card accent">
                <div className="stat-icon">
                  <Zap size={24} />
                </div>
                <div className="stat-info">
                  <h3>Avg Hashrate</h3>
                  <p className="stat-value">{formatHashrate(userStats.avgHashrate)}</p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-info">
                  <h3>Solo Blocks</h3>
                  <p className="stat-value">{userStats.soloBlocks}</p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>Pool Blocks</h3>
                  <p className="stat-value">{userStats.poolBlocks}</p>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <h3>Last Mining</h3>
                  <p className="stat-value">
                    {userStats.lastMining ? formatDate(userStats.lastMining) : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mining-history-section">
              <div className="section-header">
                <h3>Recent Mining History</h3>
                <Calendar size={20} />
              </div>
              
              {miningHistory.length === 0 ? (
                <div className="empty-state">
                  <Hash size={48} />
                  <h4>No mining history</h4>
                  <p>Start mining to see your block history here!</p>
                </div>
              ) : (
                <div className="history-list">
                  {miningHistory.map((block, index) => (
                    <div key={block.id} className="history-item">
                      <div className="block-info">
                        <div className="block-number">
                          #{block.blockNumber}
                        </div>
                        <div className="block-details">
                          <span className="block-reward">
                            +{formatAEGT(block.reward)} AEGT
                          </span>
                          <span className={`block-type ${block.isSolo ? 'solo' : 'pool'}`}>
                            {block.isSolo ? 'Solo' : 'Pool'}
                          </span>
                        </div>
                      </div>
                      <div className="block-meta">
                        <span className="block-hashrate">
                          {formatHashrate(block.hashrate)}
                        </span>
                        <span className="block-time">
                          {formatTime(block.minedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'global' && globalStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="global-stats"
          >
            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-info">
                  <h3>Active Miners</h3>
                  <p className="stat-value">{globalStats.currentActiveMiners}</p>
                </div>
              </div>

              <div className="stat-card secondary">
                <div className="stat-icon">
                  <Hash size={24} />
                </div>
                <div className="stat-info">
                  <h3>Blocks (24h)</h3>
                  <p className="stat-value">{globalStats.last24Hours.totalBlocks}</p>
                </div>
              </div>

              <div className="stat-card accent">
                <div className="stat-icon">
                  <Coins size={24} />
                </div>
                <div className="stat-info">
                  <h3>Rewards (24h)</h3>
                  <p className="stat-value">
                    {formatAEGT(globalStats.last24Hours.totalRewards)} AEGT
                  </p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">
                  <Zap size={24} />
                </div>
                <div className="stat-info">
                  <h3>Avg Hashrate</h3>
                  <p className="stat-value">
                    {formatHashrate(globalStats.last24Hours.avgHashrate)}
                  </p>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-info">
                  <h3>Solo Blocks (24h)</h3>
                  <p className="stat-value">{globalStats.last24Hours.soloBlocks}</p>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>Pool Blocks (24h)</h3>
                  <p className="stat-value">{globalStats.last24Hours.poolBlocks}</p>
                </div>
              </div>
            </div>

            <div className="network-info">
              <h3>Network Information</h3>
              <div className="network-stats">
                <div className="network-stat">
                  <span className="label">Active Miners:</span>
                  <span className="value">{globalStats.currentActiveMiners}</span>
                </div>
                <div className="network-stat">
                  <span className="label">Last Block:</span>
                  <span className="value">
                    {globalStats.last24Hours.lastBlockTime 
                      ? formatTime(globalStats.last24Hours.lastBlockTime)
                      : 'No recent blocks'
                    }
                  </span>
                </div>
                <div className="network-stat">
                  <span className="label">Network Hashrate:</span>
                  <span className="value">
                    {formatHashrate(globalStats.last24Hours.avgHashrate * globalStats.currentActiveMiners)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="leaderboard-stats"
          >
            <div className="leaderboard-header">
              <Trophy size={24} />
              <h3>Top Miners</h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <Trophy size={48} />
                <h4>No miners yet</h4>
                <p>Be the first to start mining and top the leaderboard!</p>
              </div>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <div key={index} className={`leaderboard-item rank-${entry.rank}`}>
                    <div className="rank-badge">
                      {entry.rank === 1 && <Trophy size={20} className="gold" />}
                      {entry.rank === 2 && <Trophy size={20} className="silver" />}
                      {entry.rank === 3 && <Trophy size={20} className="bronze" />}
                      {entry.rank > 3 && <span className="rank-number">#{entry.rank}</span>}
                    </div>
                    <div className="miner-info">
                      <div className="miner-avatar">
                        {entry.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="miner-details">
                        <h4>{entry.firstName}</h4>
                        <p>@{entry.username || 'anonymous'}</p>
                        <span className="miner-level">Level {entry.minerLevel}</span>
                      </div>
                    </div>
                    <div className="miner-stats">
                      <div className="stat">
                        <Hash size={16} />
                        <span>{entry.blocksMined} blocks</span>
                      </div>
                      <div className="stat">
                        <Coins size={16} />
                        <span>{formatAEGT(entry.totalRewards)} AEGT</span>
                      </div>
                      {entry.lastMining && (
                        <div className="stat">
                          <Clock size={16} />
                          <span>{formatDate(entry.lastMining)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Stats;