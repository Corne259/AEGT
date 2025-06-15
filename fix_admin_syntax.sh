#!/bin/bash

# Fix AdminPanel.js syntax error
echo "🔧 Fixing AdminPanel.js syntax error..."

cat > /home/daimond/AEGT/frontend/src/pages/AdminPanel.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, Settings, DollarSign, Zap, BarChart3, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import './AdminPanel.css';

const AdminPanel = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [miningActivity, setMiningActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const [upgradeConfig, setUpgradeConfig] = useState({
    upgradeType: 'miner',
    level: 1,
    newPrice: 0.1
  });

  const [miningConfig, setMiningConfig] = useState({
    blockTime: 180000,
    baseReward: 1000000000,
    baseHashrate: 100,
    energyRegenRate: 250,
    treasuryFeePercentage: 10
  });

  const isAdmin = user?.telegram_id === 1651155083;

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }
    fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/dashboard', {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/users?limit=50', {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };

  const fetchMiningActivity = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/mining-activity?limit=30', {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMiningActivity(data.data.blocks);
      }
    } catch (error) {
      console.error('Mining activity fetch error:', error);
    }
  };

  const updateUpgradePrice = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/upgrade-prices', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(upgradeConfig)
      });

      if (response.ok) {
        toast.success('Upgrade price updated successfully');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const updateMiningConfig = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/mining-config', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(miningConfig)
      });

      if (response.ok) {
        toast.success('Mining configuration updated successfully');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to update configuration');
    }
  };

  const resetSystemData = async () => {
    if (!window.confirm('Are you sure you want to reset ALL system data? This cannot be undone!')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://webapp.aegisum.co.za/api/admin/reset-data', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        toast.success('System data reset successfully');
        fetchDashboardData();
        fetchUsers();
        fetchMiningActivity();
      }
    } catch (error) {
      toast.error('Failed to reset data');
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <Shield size={64} />
        <h2>Access Denied</h2>
        <p>Admin privileges required to access this panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1><Shield size={24} />Admin Panel</h1>
        <div className="admin-actions">
          <button onClick={resetSystemData} className="reset-btn">
            <Trash2 size={16} />Reset Data
          </button>
          <button onClick={() => window.location.reload()} className="refresh-btn">
            <RefreshCw size={16} />Refresh
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'mining', label: 'Mining', icon: Activity },
          { id: 'config', label: 'Configuration', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'users') fetchUsers();
              if (tab.id === 'mining') fetchMiningActivity();
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && dashboardData && (
          <div className="dashboard-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <Users size={24} />
                <div>
                  <h3>Users</h3>
                  <p className="stat-number">{dashboardData.users.total_users || 0}</p>
                  <p className="stat-detail">+{dashboardData.users.new_users_24h || 0} today</p>
                </div>
              </div>
              
              <div className="stat-card">
                <Activity size={24} />
                <div>
                  <h3>Active Miners</h3>
                  <p className="stat-number">{dashboardData.mining.currentActiveMiners || 0}</p>
                  <p className="stat-detail">{dashboardData.mining.total_blocks_24h || 0} blocks today</p>
                </div>
              </div>
              
              <div className="stat-card">
                <DollarSign size={24} />
                <div>
                  <h3>TON Volume</h3>
                  <p className="stat-number">{((dashboardData.ton.total_ton_volume || 0) / 1e9).toFixed(2)}</p>
                  <p className="stat-detail">{dashboardData.ton.total_transactions || 0} transactions</p>
                </div>
              </div>
              
              <div className="stat-card">
                <Zap size={24} />
                <div>
                  <h3>AEGT Circulation</h3>
                  <p className="stat-number">{((dashboardData.users.total_aegt_circulation || 0) / 1e9).toFixed(0)}</p>
                  <p className="stat-detail">{((dashboardData.mining.total_rewards_24h || 0) / 1e9).toFixed(2)} mined today</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <h3>User Management ({users.length} users)</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Telegram ID</th>
                    <th>AEGT Balance</th>
                    <th>Miner Level</th>
                    <th>Last Activity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.first_name || user.username || 'Anonymous'}</td>
                      <td>{user.telegram_id}</td>
                      <td>{user.aegt_balance} AEGT</td>
                      <td>Level {user.miner_level}</td>
                      <td>{new Date(user.last_activity).toLocaleDateString()}</td>
                      <td>
                        <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mining' && (
          <div className="mining-tab">
            <h3>Recent Mining Activity ({miningActivity.length} blocks)</h3>
            <div className="mining-table">
              <table>
                <thead>
                  <tr>
                    <th>Block #</th>
                    <th>Miner</th>
                    <th>Hashrate</th>
                    <th>Reward</th>
                    <th>Type</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {miningActivity.map(block => (
                    <tr key={block.id}>
                      <td>#{block.block_number}</td>
                      <td>{block.miner.firstName || block.miner.username || 'Anonymous'}</td>
                      <td>{block.hashrate} H/s</td>
                      <td>{block.reward} AEGT</td>
                      <td>
                        <span className={`mining-type ${block.is_solo ? 'solo' : 'pool'}`}>
                          {block.is_solo ? 'Solo' : 'Pool'}
                        </span>
                      </td>
                      <td>{new Date(block.mined_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="config-tab">
            <div className="config-section">
              <h3>Upgrade Prices</h3>
              <div className="config-form">
                <select 
                  value={upgradeConfig.upgradeType}
                  onChange={(e) => setUpgradeConfig({...upgradeConfig, upgradeType: e.target.value})}
                >
                  <option value="miner">Miner Upgrade</option>
                  <option value="energy">Energy Upgrade</option>
                </select>
                <select 
                  value={upgradeConfig.level}
                  onChange={(e) => setUpgradeConfig({...upgradeConfig, level: parseInt(e.target.value)})}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={i + 1}>Level {i + 1}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  value={upgradeConfig.newPrice}
                  onChange={(e) => setUpgradeConfig({...upgradeConfig, newPrice: parseFloat(e.target.value)})}
                  placeholder="Price in TON"
                />
                <button onClick={updateUpgradePrice}>Update Price</button>
              </div>
            </div>

            <div className="config-section">
              <h3>Mining Configuration</h3>
              <div className="config-form">
                <label>
                  Block Time (ms):
                  <input
                    type="number"
                    value={miningConfig.blockTime}
                    onChange={(e) => setMiningConfig({...miningConfig, blockTime: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Base Reward:
                  <input
                    type="number"
                    value={miningConfig.baseReward}
                    onChange={(e) => setMiningConfig({...miningConfig, baseReward: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Base Hashrate:
                  <input
                    type="number"
                    value={miningConfig.baseHashrate}
                    onChange={(e) => setMiningConfig({...miningConfig, baseHashrate: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Energy Regen Rate:
                  <input
                    type="number"
                    value={miningConfig.energyRegenRate}
                    onChange={(e) => setMiningConfig({...miningConfig, energyRegenRate: parseInt(e.target.value)})}
                  />
                </label>
                <label>
                  Treasury Fee (%):
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={miningConfig.treasuryFeePercentage}
                    onChange={(e) => setMiningConfig({...miningConfig, treasuryFeePercentage: parseInt(e.target.value)})}
                  />
                </label>
                <button onClick={updateMiningConfig}>Update Configuration</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
EOF

echo "✅ AdminPanel.js syntax fixed!"
EOF