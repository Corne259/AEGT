import React, { useState } from 'react';
import styled from 'styled-components';
import { Wallet, Loader } from 'lucide-react';
import useTonConnect from '../hooks/useTonConnect';
import { useAuth } from '../hooks/useAuth';

const WalletLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const WalletButton = styled.button`
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

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0099dd, #0077bb);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ConnectButton = styled(WalletButton)`
  background: linear-gradient(135deg, #00aa44, #008833);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #00bb55, #009944);
  }
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
`;

const WalletAddress = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #00ff88;
  word-break: break-all;
`;

const StatusText = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
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

const WalletLogin = ({ onWalletLogin, showConnectOption = false }) => {
  const { isConnected, walletAddress, isConnecting, connectWallet, connectWalletToAccount } = useTonConnect();
  const { user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleWalletLogin = async () => {
    try {
      setIsAuthenticating(true);
      const result = await connectWallet();
      if (onWalletLogin) {
        onWalletLogin(result);
      }
    } catch (error) {
      console.error('Wallet login failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConnectToAccount = async () => {
    try {
      setIsAuthenticating(true);
      await connectWalletToAccount();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isConnected && walletAddress) {
    return (
      <WalletLoginContainer>
        <WalletInfo>
          <StatusText>✅ Wallet Connected</StatusText>
          <WalletAddress>{walletAddress}</WalletAddress>
        </WalletInfo>
        
        {showConnectOption && user && !user.tonWalletAddress && (
          <ConnectButton
            onClick={handleConnectToAccount}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <>
                <Loader size={20} className="animate-spin" />
                Connecting to Account...
              </>
            ) : (
              <>
                <Wallet size={20} />
                Connect to Current Account
              </>
            )}
          </ConnectButton>
        )}
      </WalletLoginContainer>
    );
  }

  return (
    <WalletLoginContainer>
      <WalletButton
        onClick={handleWalletLogin}
        disabled={isConnecting || isAuthenticating}
      >
        {isConnecting || isAuthenticating ? (
          <>
            <Loader size={20} className="animate-spin" />
            {isConnecting ? 'Connecting Wallet...' : 'Authenticating...'}
          </>
        ) : (
          <>
            <Wallet size={20} />
            Login with TON Wallet
          </>
        )}
      </WalletButton>
      
      {showConnectOption && (
        <>
          <OrDivider>
            <span>or</span>
          </OrDivider>
          <StatusText style={{ textAlign: 'center' }}>
            Connect your TON wallet to enable crypto payments and receive airdrops
          </StatusText>
        </>
      )}
    </WalletLoginContainer>
  );
};

export default WalletLogin;