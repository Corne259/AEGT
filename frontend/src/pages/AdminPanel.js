import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Settings, DollarSign, Zap, BarChart3, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const AdminPanel = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState({
    blockTime: 180,
    baseReward: 1000000000,
    energyRegenRate: 250,
    upgradePrice1: 0.1,
    upgradePrice5: 2.5,
    upgradePrice10: 12
  });
  const { user } = useAuth();
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
      const response = await fetch('https://webapp.aegisum.co.za/api/admin/dashboard', {
        headers: { 
          'Authorization': 'Bearer ' + token, 
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

  const updateConfig = async (key, value) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://webapp.aegisum.co.za/api/admin/config', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + token, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ key, value })
      });
      if (response.ok) {
        toast.success('Configuration updated!');
        setConfigs(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      toast.error('Failed to update configuration');
    }
  };

  const resetSystem = async () => {
    if (!window.confirm('Reset all mining data? This cannot be undone!')) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://webapp.aegisum.co.za/api/admin/reset', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + token, 
          'Content-Type': 'application/json' 
        }
      });
      if (response.ok) {
        toast.success('System reset successfully!');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to reset system');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        textAlign: 'center', 
        color: 'white', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Shield size={64} />
        <h2>Access Denied</h2>
        <p>Admin privileges required to access this panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        color: 'white', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div>Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh', 
      color: 'white'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🔧 Admin Control Panel</h1>
      
      {dashboardData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* System Stats */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <h3><Users size={20} /> System Statistics</h3>
            <p>Total Users: {dashboardData.users?.total_users || 0}</p>
            <p>Active Miners: {dashboardData.mining?.currentActiveMiners || 0}</p>
            <p>Blocks Mined: {dashboardData.mining?.total_blocks || 0}</p>
            <p>Total Rewards: {dashboardData.mining?.total_rewards || 0}</p>
          </div>

          {/* Mining Configuration */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <h3><Activity size={20} /> Mining Configuration</h3>
            <div style={{ marginBottom: '10px' }}>
              <label>Block Time (seconds):</label>
              <input 
                type="number" 
                value={configs.blockTime} 
                onChange={(e) => setConfigs(prev => ({ ...prev, blockTime: e.target.value }))}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              />
              <button 
                onClick={() => updateConfig('blockTime', configs.blockTime)}
                style={{ marginTop: '5px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Update
              </button>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Base Reward (AEGT):</label>
              <input 
                type="number" 
                value={configs.baseReward} 
                onChange={(e) => setConfigs(prev => ({ ...prev, baseReward: e.target.value }))}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              />
              <button 
                onClick={() => updateConfig('baseReward', configs.baseReward)}
                style={{ marginTop: '5px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Update
              </button>
            </div>
          </div>

          {/* TON Pricing */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <h3><DollarSign size={20} /> TON Upgrade Pricing</h3>
            <div style={{ marginBottom: '10px' }}>
              <label>Miner Level 1 (TON):</label>
              <input 
                type="number" 
                step="0.01"
                value={configs.upgradePrice1} 
                onChange={(e) => setConfigs(prev => ({ ...prev, upgradePrice1: e.target.value }))}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              />
              <button 
                onClick={() => updateConfig('upgradePrice1', configs.upgradePrice1)}
                style={{ marginTop: '5px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Update
              </button>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Miner Level 5 (TON):</label>
              <input 
                type="number" 
                step="0.01"
                value={configs.upgradePrice5} 
                onChange={(e) => setConfigs(prev => ({ ...prev, upgradePrice5: e.target.value }))}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              />
              <button 
                onClick={() => updateConfig('upgradePrice5', configs.upgradePrice5)}
                style={{ marginTop: '5px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Update
              </button>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label>Miner Level 10 (TON):</label>
              <input 
                type="number" 
                step="0.01"
                value={configs.upgradePrice10} 
                onChange={(e) => setConfigs(prev => ({ ...prev, upgradePrice10: e.target.value }))}
                style={{ width: '100%', padding: '5px', marginTop: '5px' }}
              />
              <button 
                onClick={() => updateConfig('upgradePrice10', configs.upgradePrice10)}
                style={{ marginTop: '5px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
              >
                Update
              </button>
            </div>
          </div>

          {/* System Actions */}
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
            <h3><Settings size={20} /> System Actions</h3>
            <button 
              onClick={fetchDashboardData}
              style={{ 
                width: '100%', 
                padding: '10px', 
                marginBottom: '10px', 
                background: '#2196F3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={16} /> Refresh Data
            </button>
            
            <button 
              onClick={resetSystem}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: '#f44336', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={16} /> Reset All Data
            </button>
          </div>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '14px', opacity: '0.8' }}>
        Admin Panel - Telegram ID: {user?.telegram_id}
      </div>
    </div>
  );
};

export default AdminPanel;
