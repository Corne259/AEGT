import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Battery, Cpu, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { upgradeAPI } from '../services/api';
import { useTonConnect } from '../hooks/useTonConnect';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import TonPayment from '../components/TonPayment';
import './UpgradeShop.css';

const UpgradeShop = () => {
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const { isConnected } = useTonConnect();
  const { hapticFeedback } = useTelegramWebApp();
  const queryClient = useQueryClient();

  // Fetch available upgrades
  const { data: upgradesData, isLoading } = useQuery(
    'availableUpgrades',
    upgradeAPI.getAvailable,
    {
      select: (response) => response.data
    }
  );

  // Purchase upgrade mutation
  const purchaseUpgradeMutation = useMutation(upgradeAPI.purchase, {
    onSuccess: (response) => {
      hapticFeedback('notification', 'success');
      toast.success(response.message);
      queryClient.invalidateQueries('availableUpgrades');
      queryClient.invalidateQueries('miningStatus');
      queryClient.invalidateQueries('energyStatus');
      setShowPayment(false);
      setSelectedUpgrade(null);
    },
    onError: (error) => {
      hapticFeedback('notification', 'error');
      toast.error(error.response?.data?.message || 'Purchase failed');
    }
  });

  const getUpgradeIcon = (iconType) => {
    switch (iconType) {
      case 'cpu': return <Cpu size={24} />;
      case 'battery': return <Battery size={24} />;
      case 'zap': return <Zap size={24} />;
      default: return <TrendingUp size={24} />;
    }
  };

  const handleUpgradeClick = (upgrade) => {
    if (!isConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }
    setSelectedUpgrade(upgrade);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (transactionHash) => {
    try {
      await purchaseUpgradeMutation.mutateAsync({
        upgradeId: selectedUpgrade.id,
        tonAmount: selectedUpgrade.cost,
        transactionHash
      });
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="upgrade-loading">
        <div className="loading-spinner" />
        <p>Loading upgrades...</p>
      </div>
    );
  }

  const upgrades = upgradesData?.upgrades || [];
  const userStats = upgradesData?.userStats || {};

  return (
    <div className="upgrade-shop">
      <div className="shop-header">
        <h2>Upgrade Shop</h2>
        <p>Enhance your mining capabilities with TON</p>
        
        {/* User Stats */}
        <div className="user-stats">
          <div className="stat-item">
            <Cpu size={16} />
            <span>Miner Level {userStats.minerLevel}</span>
          </div>
          <div className="stat-item">
            <Battery size={16} />
            <span>Energy Level {userStats.energyLevel}</span>
          </div>
          <div className="stat-item">
            <TrendingUp size={16} />
            <span>{userStats.hashrate} H/s</span>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="wallet-status">
          {isConnected ? (
            <div className="wallet-connected">
              <CheckCircle size={16} />
              <span>Wallet Connected</span>
            </div>
          ) : (
            <div className="wallet-disconnected">
              <AlertCircle size={16} />
              <span>Connect wallet to purchase upgrades</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="upgrades-grid">
        {upgrades.map((upgrade) => (
          <motion.div
            key={upgrade.id}
            className="upgrade-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="upgrade-icon">
              {getUpgradeIcon(upgrade.icon)}
            </div>
            <h3>{upgrade.name}</h3>
            <p>{upgrade.description}</p>
            
            <div className="upgrade-details">
              <div className="upgrade-benefit">
                <TrendingUp size={16} />
                <span>{upgrade.benefit}</span>
              </div>
              
              {upgrade.currentLevel && (
                <div className="level-info">
                  <span>Level {upgrade.currentLevel} → {upgrade.nextLevel}</span>
                </div>
              )}
            </div>
            
            <button 
              className="upgrade-btn"
              onClick={() => handleUpgradeClick(upgrade)}
              disabled={!isConnected || purchaseUpgradeMutation.isLoading}
            >
              <Wallet size={16} />
              <span>Pay {upgrade.cost} TON</span>
            </button>
          </motion.div>
        ))}
      </div>

      {upgrades.length === 0 && (
        <div className="no-upgrades">
          <h3>All Upgrades Complete!</h3>
          <p>You've reached the maximum level for all upgrades.</p>
        </div>
      )}

      {/* TON Payment Modal */}
      {showPayment && selectedUpgrade && (
        <TonPayment
          isOpen={showPayment}
          onClose={() => {
            setShowPayment(false);
            setSelectedUpgrade(null);
          }}
          amount={selectedUpgrade.cost}
          description={`Purchase ${selectedUpgrade.name}`}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default UpgradeShop;