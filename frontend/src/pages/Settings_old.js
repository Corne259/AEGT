import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  User,
  Wallet,
  Zap,
  Info,
  LogOut,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useTonConnect } from '../hooks/useTonConnect';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const { user, logout } = useAuth();
  const { wallet, disconnect } = useTonConnect();
  const { hapticFeedback } = useTelegramWebApp();

  const handleToggle = (setter, value, label) => {
    setter(!value);
    hapticFeedback('selection');
    toast.success(`${label} ${!value ? 'enabled' : 'disabled'}`);
  };

  const handleLogout = () => {
    hapticFeedback('impact', 'medium');
    logout();
    toast.success('Logged out successfully');
  };

  const handleDisconnectWallet = () => {
    hapticFeedback('impact', 'medium');
    disconnect();
    toast.success('Wallet disconnected');
  };

  const clearData = () => {
    hapticFeedback('impact', 'heavy');
    localStorage.clear();
    toast.success('App data cleared');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Customize your mining experience</p>
      </div>
      
      <div className="settings-sections">
        {/* User Info Section */}
        <div className="settings-section">
          <h3><User size={18} /> Account</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Username</span>
              <span className="setting-value">{user?.username || 'Anonymous'}</span>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">User ID</span>
              <span className="setting-value">#{user?.id || 'N/A'}</span>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Miner Level</span>
              <span className="setting-value">Level {user?.minerLevel || 1}</span>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        {wallet && (
          <div className="settings-section">
            <h3><Wallet size={18} /> Wallet</h3>
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Connected Wallet</span>
                <span className="setting-value">
                  {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </span>
              </div>
              <button 
                className="setting-button danger"
                onClick={handleDisconnectWallet}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
        
        {/* Appearance Section */}
        <div className="settings-section">
          <h3>🎨 Appearance</h3>
          <div className="setting-item">
            <div className="setting-info">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span>Dark Mode</span>
            </div>
            <div className="setting-toggle">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={() => handleToggle(setDarkMode, darkMode, 'Dark mode')}
              />
            </div>
          </div>
        </div>
        
        {/* Audio Section */}
        <div className="settings-section">
          <h3>🔊 Audio & Haptics</h3>
          <div className="setting-item">
            <div className="setting-info">
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span>Sound Effects</span>
            </div>
            <div className="setting-toggle">
              <input 
                type="checkbox" 
                checked={soundEnabled}
                onChange={() => handleToggle(setSoundEnabled, soundEnabled, 'Sound effects')}
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <Zap size={20} />
              <span>Haptic Feedback</span>
            </div>
            <div className="setting-toggle">
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h3>🔔 Notifications</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span>Mining Alerts</span>
            </div>
            <div className="setting-toggle">
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={() => handleToggle(setNotifications, notifications, 'Notifications')}
              />
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="settings-section">
          <h3><Info size={18} /> App Info</h3>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Version</span>
              <span className="setting-value">1.0.0</span>
            </div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Network</span>
              <span className="setting-value">TON Mainnet</span>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="settings-section">
          <h3>⚡ Actions</h3>
          <div className="setting-item">
            <button 
              className="setting-button danger"
              onClick={clearData}
            >
              <Trash2 size={18} />
              Clear App Data
            </button>
          </div>
          <div className="setting-item">
            <button 
              className="setting-button danger"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;