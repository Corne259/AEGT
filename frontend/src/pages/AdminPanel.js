import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, Settings, DollarSign, Zap, BarChart3, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const AdminPanel = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  
  // Admin user ID - replace with actual admin ID
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
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemReset = async () => {
    if (!window.confirm('Are you sure you want to reset the system? This will clear all data!')) {
      return;
    }
    
    try {
      const response = await api.post('/admin/system/reset');
      if (response.data.success) {
        toast.success('System reset successfully');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('System reset error:', error);
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
        <RefreshCw className="animate-spin" size={32} />
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
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          <Shield style={{ display: 'inline', marginRight: '10px' }} />
          Admin Panel
        </h1>
        <p>System administration and monitoring</p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'mining', label: 'Mining', icon: Activity },
            { id: 'system', label: 'System', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && dashboardData && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>System Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Users size={24} />
                <h3>Total Users</h3>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {dashboardData.users?.total_users || 0}
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Activity size={24} />
                <h3>Active Miners</h3>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {dashboardData.mining?.currentActiveMiners || 0}
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <BarChart3 size={24} />
                <h3>Blocks Today</h3>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {dashboardData.mining?.total_blocks_24h || 0}
              </p>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <DollarSign size={24} />
                <h3>Total Revenue</h3>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {dashboardData.revenue?.total_ton || '0'} TON
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>System Management</h2>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '15px' }}>Danger Zone</h3>
            <button
              onClick={handleSystemReset}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={16} />
              Reset System Data
            </button>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: '0.8' }}>
              This will permanently delete all users, mining data, and transactions.
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={fetchDashboardData}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;