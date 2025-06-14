import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Volume2, 
  Wallet, 
  User, 
  BarChart3,
  Zap,
  LogOut,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { useTonConnect } from '../hooks/useTonConnect';
import { userAPI, upgradeAPI } from '../services/api';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { user, logout } = useAuth();
  const { wallet, tonConnectUI } = useTonConnect();

  // Fetch user stats
  const { data: userStats } = useQuery(
    'userStats',
    userAPI.getStats,
    {
      select: (response) => response.data
    }
  );

  // Fetch upgrade history
  const { data: upgradeHistory } = useQuery(
    'upgradeHistory',
    upgradeAPI.getHistory,
    {
      select: (response) => response.data
    }
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatAddress = (address) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.00';
    return (balance / 1e9).toFixed(2);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your account and preferences</p>
      </div>
      
      <div className="settings-sections">
        {/* User Profile Section */}
        <div className="settings-section">
          <h3>
            <User size={20} />
            Profile
          </h3>
          <div className="profile-info">
            <div className="profile-item">
              <span className="label">Username:</span>
              <span className="value">{user?.username || 'Anonymous'}</span>
            </div>
            <div className="profile-item">
              <span className="label">First Name:</span>
              <span className="value">{user?.firstName || 'N/A'}</span>
            </div>
            <div className="profile-item">
              <span className="label">AEGT Balance:</span>
              <span className="value">{formatBalance(user?.aegtBalance)} AEGT</span>
            </div>
            <div className="profile-item">
              <span className="label">Miner Level:</span>
              <span className="value">Level {user?.minerLevel || 1}</span>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="settings-section">
          <h3>
            <Wallet size={20} />
            TON Wallet
          </h3>
          <div className="wallet-info">
            {wallet ? (
              <div className="wallet-connected">
                <div className="wallet-status">
                  <CheckCircle size={16} className="status-icon connected" />
                  <span>Wallet Connected</span>
                </div>
                <div className="wallet-details">
                  <div className="wallet-address">
                    <span>{formatAddress(wallet.account.address)}</span>
                    <button 
                      onClick={() => copyToClipboard(wallet.account.address)}
                      className="copy-btn"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => tonConnectUI.disconnect()}
                    className="disconnect-btn"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="wallet-disconnected">
                <div className="wallet-status">
                  <AlertCircle size={16} className="status-icon disconnected" />
                  <span>No Wallet Connected</span>
                </div>
                <button 
                  onClick={() => tonConnectUI.openModal()}
                  className="connect-btn"
                >
                  Connect TON Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mining Stats Section */}
        <div className="settings-section">
          <h3>
            <BarChart3 size={20} />
            Mining Statistics
          </h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Blocks Mined:</span>
              <span className="stat-value">{userStats?.totalBlocks || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Rewards:</span>
              <span className="stat-value">{formatBalance(userStats?.totalRewards)} AEGT</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Solo Blocks:</span>
              <span className="stat-value">{userStats?.soloBlocks || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pool Blocks:</span>
              <span className="stat-value">{userStats?.poolBlocks || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Hashrate:</span>
              <span className="stat-value">{userStats?.avgHashrate || 0} H/s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Energy Capacity:</span>
              <span className="stat-value">{user?.energyCapacity || 1000}</span>
            </div>
          </div>
        </div>

        {/* Recent Upgrades */}
        <div className="settings-section">
          <h3>
            <Zap size={20} />
            Recent Upgrades
          </h3>
          <div className="upgrade-history">
            {upgradeHistory?.transactions?.length > 0 ? (
              upgradeHistory.transactions.slice(0, 5).map((tx, index) => (
                <div key={index} className="upgrade-item">
                  <div className="upgrade-info">
                    <span className="upgrade-type">{tx.type.toUpperCase()}</span>
                    <span className="upgrade-date">
                      {new Date(tx.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="upgrade-amount">
                    {tx.amount} TON
                  </div>
                </div>
              ))
            ) : (
              <p className="no-upgrades">No upgrades purchased yet</p>
            )}
          </div>
        </div>

        {/* App Settings */}
        <div className="settings-section">
          <h3>
            <SettingsIcon size={20} />
            App Settings
          </h3>
          <div className="setting-item">
            <div className="setting-info">
              <Moon size={20} />
              <span>Dark Mode</span>
            </div>
            <div className="setting-toggle">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <Volume2 size={20} />
              <span>Sound Effects</span>
            </div>
            <div className="setting-toggle">
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="settings-section">
          <h3>Links</h3>
          <div className="links-list">
            <a 
              href="https://t.me/AegisumSupport" 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-item"
            >
              <span>Support</span>
              <ExternalLink size={16} />
            </a>
            <a 
              href="https://aegisum.co.za" 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-item"
            >
              <span>Website</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Logout Section */}
        <div className="settings-section">
          <button 
            onClick={logout}
            className="logout-btn"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;