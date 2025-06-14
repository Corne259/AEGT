import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Battery, 
  Cpu, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  Coins,
  ArrowUp,
  Clock,
  Star,
  Gift
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { upgradeAPI, energyAPI } from '../services/api';
import { useTonConnect } from '../hooks/useTonConnect';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useAuth } from '../hooks/useAuth';
import TonPayment from '../components/TonPayment';

const UpgradeShop = () => {
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState('aegt'); // 'aegt' or 'ton'
  const { tonConnectUI, wallet } = useTonConnect();
  const { hapticFeedback } = useTelegramWebApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch energy status
  const { data: energyStatus } = useQuery(
    'energyStatus',
    energyAPI.getStatus,
    {
      refetchInterval: 5000,
      select: (response) => response.data
    }
  );

  // Energy restore mutation
  const restoreEnergyMutation = useMutation(energyAPI.restore, {
    onSuccess: () => {
      hapticFeedback('notification', 'success');
      toast.success('Energy restored!');
      queryClient.invalidateQueries('energyStatus');
    },
    onError: (error) => {
      hapticFeedback('notification', 'error');
      toast.error(error.response?.data?.message || 'Energy restore failed');
    }
  });

  // Purchase upgrade mutation
  const purchaseUpgradeMutation = useMutation(upgradeAPI.purchase, {
    onSuccess: (response) => {
      hapticFeedback('notification', 'success');
      toast.success(response.message);
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

  // Predefined upgrades
  const upgrades = [
    {
      id: 'miner_level_2',
      name: 'Miner Level 2',
      description: 'Increase mining speed by 50%',
      icon: 'cpu',
      costAEGT: 5000000000, // 5 AEGT
      costTON: 0.5, // 0.5 TON
      benefits: ['+50% Mining Speed', '+25% Energy Efficiency'],
      currentLevel: user?.minerLevel || 1,
      maxLevel: 10,
      available: (user?.minerLevel || 1) < 2
    },
    {
      id: 'energy_capacity_2',
      name: 'Energy Capacity Level 2',
      description: 'Increase energy capacity by 500',
      icon: 'battery',
      costAEGT: 3000000000, // 3 AEGT
      costTON: 0.3, // 0.3 TON
      benefits: ['+500 Energy Capacity', '+20% Energy Regen'],
      currentLevel: user?.energyLevel || 1,
      maxLevel: 10,
      available: (user?.energyLevel || 1) < 2
    },
    {
      id: 'hashrate_boost',
      name: 'Hashrate Booster',
      description: 'Permanent +100 hashrate boost',
      icon: 'zap',
      costAEGT: 2000000000, // 2 AEGT
      costTON: 0.2, // 0.2 TON
      benefits: ['+100 Hashrate', '+10% Block Rewards'],
      currentLevel: 0,
      maxLevel: 5,
      available: true
    }
  ];

  const getUpgradeIcon = (iconType) => {
    switch (iconType) {
      case 'cpu': return <Cpu size={24} />;
      case 'battery': return <Battery size={24} />;
      case 'zap': return <Zap size={24} />;
      default: return <TrendingUp size={24} />;
    }
  };

  const handleUpgradeClick = (upgrade, type) => {
    setSelectedUpgrade(upgrade);
    setPaymentType(type);
    setShowPayment(true);
  };

  const handleAEGTUpgrade = async (upgrade) => {
    try {
      await purchaseUpgradeMutation.mutateAsync({
        upgradeId: upgrade.id,
        paymentType: 'aegt',
        amount: upgrade.costAEGT
      });
    } catch (error) {
      console.error('AEGT upgrade error:', error);
    }
  };

  const handleTONUpgrade = async (transactionHash) => {
    try {
      await purchaseUpgradeMutation.mutateAsync({
        upgradeId: selectedUpgrade.id,
        paymentType: 'ton',
        amount: selectedUpgrade.costTON,
        transactionHash
      });
    } catch (error) {
      console.error('TON upgrade error:', error);
    }
  };

  const handleEnergyRestore = () => {
    hapticFeedback('impact', 'medium');
    restoreEnergyMutation.mutate();
  };

  const formatAEGT = (amount) => {
    return (amount / 1000000000).toFixed(1);
  };

  return (
    <div className="upgrade-shop">
      <div className="shop-header">
        <h2>🛒 Upgrade Shop</h2>
        <p>Enhance your mining capabilities</p>
        
        {/* User Stats */}
        <div className="user-stats">
          <div className="stat-card">
            <Coins size={20} />
            <div>
              <span className="stat-label">AEGT Balance</span>
              <span className="stat-value">{formatAEGT(user?.aegtBalance || 0)} AEGT</span>
            </div>
          </div>
          <div className="stat-card">
            <Cpu size={20} />
            <div>
              <span className="stat-label">Miner Level</span>
              <span className="stat-value">Level {user?.minerLevel || 1}</span>
            </div>
          </div>
          <div className="stat-card">
            <Battery size={20} />
            <div>
              <span className="stat-label">Energy</span>
              <span className="stat-value">
                {energyStatus?.current || 0}/{energyStatus?.max || 1000}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Restore Section */}
      <div className="energy-section">
        <h3>⚡ Energy Management</h3>
        <div className="energy-restore-card">
          <div className="energy-info">
            <Battery size={24} />
            <div>
              <h4>Restore Energy</h4>
              <p>Instantly restore all energy</p>
            </div>
          </div>
          <div className="energy-actions">
            <button 
              className="restore-btn aegt"
              onClick={handleEnergyRestore}
              disabled={restoreEnergyMutation.isLoading || (energyStatus?.current >= energyStatus?.max)}
            >
              <Coins size={16} />
              1.0 AEGT
            </button>
            <button 
              className="restore-btn ton"
              onClick={() => handleUpgradeClick({
                id: 'energy_restore',
                name: 'Energy Restore',
                costTON: 0.1
              }, 'ton')}
              disabled={energyStatus?.current >= energyStatus?.max}
            >
              <Wallet size={16} />
              0.1 TON
            </button>
          </div>
        </div>
      </div>

      {/* Upgrades Section */}
      <div className="upgrades-section">
        <h3>🚀 Upgrades</h3>
        <div className="upgrades-grid">
          {upgrades.map((upgrade) => (
            <motion.div
              key={upgrade.id}
              className={`upgrade-card ${!upgrade.available ? 'disabled' : ''}`}
              whileHover={{ scale: upgrade.available ? 1.02 : 1 }}
              whileTap={{ scale: upgrade.available ? 0.98 : 1 }}
            >
              <div className="upgrade-header">
                <div className="upgrade-icon">
                  {getUpgradeIcon(upgrade.icon)}
                </div>
                <div className="upgrade-info">
                  <h4>{upgrade.name}</h4>
                  <p>{upgrade.description}</p>
                </div>
                {!upgrade.available && (
                  <div className="upgrade-status">
                    <CheckCircle size={20} />
                    <span>Owned</span>
                  </div>
                )}
              </div>

              <div className="upgrade-benefits">
                {upgrade.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <Star size={14} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="upgrade-level">
                <span>Level {upgrade.currentLevel}/{upgrade.maxLevel}</span>
                <div className="level-bar">
                  <div 
                    className="level-progress"
                    style={{ width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%` }}
                  />
                </div>
              </div>

              {upgrade.available && (
                <div className="upgrade-actions">
                  <button 
                    className="upgrade-btn aegt"
                    onClick={() => handleAEGTUpgrade(upgrade)}
                    disabled={purchaseUpgradeMutation.isLoading || (user?.aegtBalance || 0) < upgrade.costAEGT}
                  >
                    <Coins size={16} />
                    {formatAEGT(upgrade.costAEGT)} AEGT
                  </button>
                  <button 
                    className="upgrade-btn ton"
                    onClick={() => handleUpgradeClick(upgrade, 'ton')}
                    disabled={purchaseUpgradeMutation.isLoading}
                  >
                    <Wallet size={16} />
                    {upgrade.costTON} TON
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* TON Payment Modal */}
      {showPayment && selectedUpgrade && paymentType === 'ton' && (
        <TonPayment
          amount={selectedUpgrade.costTON}
          description={`Purchase ${selectedUpgrade.name}`}
          onSuccess={handleTONUpgrade}
          onCancel={() => {
            setShowPayment(false);
            setSelectedUpgrade(null);
          }}
        />
      )}
    </div>
  );
};

export default UpgradeShop;