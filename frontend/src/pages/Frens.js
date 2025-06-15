import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Gift, 
  Copy, 
  Share2, 
  Trophy,
  UserPlus,
  Coins,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import './Frens.css';

const Frens = () => {
  const [referralData, setReferralData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invite');
  const [copied, setCopied] = useState(false);
  const { webApp } = useTelegramWebApp();

  useEffect(() => {
    fetchReferralData();
    fetchFriends();
    fetchLeaderboard();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/friends/referral-code', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral information');
    }
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/friends/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.data.friends || []);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/friends/leaderboard', {
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
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareReferralLink = () => {
    if (!referralData?.referralLink) return;

    const shareText = `🎮 Join me on Aegisum Tap2Earn!\n\n⛏️ Mine AEGT tokens\n💰 Earn crypto rewards\n🚀 Upgrade with TON\n\nUse my referral link and we both get bonus AEGT!\n\n${referralData.referralLink}`;

    if (webApp?.openTelegramLink) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralData.referralLink)}&text=${encodeURIComponent(shareText)}`;
      webApp.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({
        title: 'Join Aegisum Tap2Earn!',
        text: shareText,
        url: referralData.referralLink
      });
    } else {
      copyReferralLink();
    }
  };

  const formatAEGT = (amount) => {
    return (parseInt(amount) / 1000000000).toFixed(3);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="frens-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="frens-page">
      <div className="frens-header">
        <div className="header-icon">
          <Users size={32} />
        </div>
        <h1>Invite Frens</h1>
        <p>Earn bonus AEGT by inviting friends!</p>
      </div>

      <div className="frens-tabs">
        <button 
          className={`tab-btn ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          <UserPlus size={20} />
          Invite
        </button>
        <button 
          className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <Users size={20} />
          My Frens ({friends.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={20} />
          Leaderboard
        </button>
      </div>

      <div className="frens-content">
        {activeTab === 'invite' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="invite-section"
          >
            <div className="invite-card">
              <div className="invite-header">
                <Gift size={24} />
                <h3>Referral Rewards</h3>
              </div>
              <div className="reward-info">
                <div className="reward-item">
                  <span className="reward-label">You get:</span>
                  <span className="reward-value">0.05 AEGT</span>
                </div>
                <div className="reward-item">
                  <span className="reward-label">Friend gets:</span>
                  <span className="reward-value">0.025 AEGT</span>
                </div>
              </div>
            </div>

            {referralData && (
              <div className="referral-section">
                <div className="referral-code-card">
                  <h4>Your Referral Code</h4>
                  <div className="referral-code">
                    {referralData.referralCode}
                  </div>
                </div>

                <div className="referral-link-card">
                  <h4>Share Your Link</h4>
                  <div className="referral-link">
                    <input 
                      type="text" 
                      value={referralData.referralLink} 
                      readOnly 
                      className="link-input"
                    />
                    <button 
                      className="copy-btn"
                      onClick={copyReferralLink}
                    >
                      {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="share-buttons">
                  <button 
                    className="share-btn primary"
                    onClick={shareReferralLink}
                  >
                    <Share2 size={20} />
                    Share on Telegram
                  </button>
                  <button 
                    className="share-btn secondary"
                    onClick={copyReferralLink}
                  >
                    <Copy size={20} />
                    Copy Link
                  </button>
                </div>
              </div>
            )}

            <div className="invite-instructions">
              <h4>How it works:</h4>
              <ol>
                <li>Share your referral link with friends</li>
                <li>They join Aegisum using your link</li>
                <li>Both of you receive bonus AEGT!</li>
                <li>Start mining together and earn more</li>
              </ol>
            </div>
          </motion.div>
        )}

        {activeTab === 'friends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="friends-section"
          >
            {friends.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <h3>No friends yet</h3>
                <p>Invite your friends to start earning together!</p>
                <button 
                  className="invite-btn"
                  onClick={() => setActiveTab('invite')}
                >
                  <UserPlus size={20} />
                  Invite Friends
                </button>
              </div>
            ) : (
              <div className="friends-list">
                {friends.map((friend, index) => (
                  <div key={index} className="friend-card">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        {friend.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="friend-details">
                        <h4>{friend.firstName}</h4>
                        <p>@{friend.username || 'anonymous'}</p>
                        <span className="join-date">
                          Joined {formatDate(friend.joinedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="friend-stats">
                      <div className="stat">
                        <span className="stat-label">Level</span>
                        <span className="stat-value">{friend.minerLevel}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Blocks</span>
                        <span className="stat-value">{friend.totalBlocks}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Bonus</span>
                        <span className="stat-value">
                          {formatAEGT(friend.bonusEarned)} AEGT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="leaderboard-section"
          >
            <div className="leaderboard-header">
              <Trophy size={24} />
              <h3>Top Referrers</h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <Trophy size={48} />
                <h3>No referrers yet</h3>
                <p>Be the first to invite friends and top the leaderboard!</p>
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
                    <div className="player-info">
                      <div className="player-avatar">
                        {entry.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="player-details">
                        <h4>{entry.firstName}</h4>
                        <p>@{entry.username || 'anonymous'}</p>
                      </div>
                    </div>
                    <div className="player-stats">
                      <div className="stat">
                        <Coins size={16} />
                        <span>{formatAEGT(entry.totalBonuses)} AEGT</span>
                      </div>
                      <div className="stat">
                        <Users size={16} />
                        <span>{entry.totalReferrals} frens</span>
                      </div>
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

export default Frens;