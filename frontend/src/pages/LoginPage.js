import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Zap, Smartphone } from 'lucide-react';
import WalletLogin from '../components/WalletLogin';

const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 16px 0 32px 0;
  line-height: 1.5;
`;

const LoginOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TelegramButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #0088cc, #0066aa);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 56px;

  &:hover {
    background: linear-gradient(135deg, #0099dd, #0077bb);
    transform: translateY(-2px);
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 8px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
`;

const FeatureList = styled.div`
  margin-top: 32px;
  text-align: left;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
`;

const FeatureIcon = styled.div`
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`;

const LoginPage = ({ onTelegramLogin, onWalletLogin }) => {

  const handleTelegramLogin = () => {
    if (onTelegramLogin) {
      onTelegramLogin();
    }
  };

  const handleWalletLogin = async (walletData) => {
    try {
      // The wallet login already handles authentication
      // Just need to update the auth context
      if (onWalletLogin) {
        onWalletLogin(walletData);
      }
    } catch (error) {
      console.error('Wallet login failed:', error);
    }
  };

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo>
          <LogoIcon>
            <Zap size={32} color="white" />
          </LogoIcon>
          <Title>Aegisum</Title>
        </Logo>
        
        <Subtitle>
          Start mining AEGT tokens with your virtual miner. 
          Connect via Telegram or TON wallet to begin!
        </Subtitle>

        <LoginOptions>
          <TelegramButton onClick={handleTelegramLogin}>
            <Smartphone size={20} />
            Continue with Telegram
          </TelegramButton>

          <OrDivider>
            <span>or</span>
          </OrDivider>

          <WalletLogin onWalletLogin={handleWalletLogin} />
        </LoginOptions>

        <FeatureList>
          <Feature>
            <FeatureIcon>⚡</FeatureIcon>
            Mine AEGT tokens automatically
          </Feature>
          <Feature>
            <FeatureIcon>🔧</FeatureIcon>
            Upgrade your mining equipment
          </Feature>
          <Feature>
            <FeatureIcon>💰</FeatureIcon>
            Earn rewards through passive mining
          </Feature>
          <Feature>
            <FeatureIcon>🪙</FeatureIcon>
            Pay with TON for instant upgrades
          </Feature>
        </FeatureList>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;