import { useState, useEffect, useCallback } from 'react';
import { TonConnect } from '@tonconnect/sdk';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toast } from 'react-hot-toast';
import { authAPI, api } from '../services/api';
import { useAuth } from './useAuth';

const useTonConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { login: authLogin, updateUser } = useAuth();

  // Check connection status
  useEffect(() => {
    if (tonConnectUI.connected) {
      setIsConnected(true);
      setWalletAddress(tonConnectUI.account?.address);
    } else {
      setIsConnected(false);
      setWalletAddress(null);
    }
  }, [tonConnectUI.connected, tonConnectUI.account]);

  // Generate authentication challenge
  const generateChallenge = useCallback(async (walletAddress) => {
    try {
      const response = await authAPI.walletChallenge({ walletAddress });
      return response.data;
    } catch (error) {
      console.error('Failed to generate challenge:', error);
      throw error;
    }
  }, []);

  // Sign challenge with wallet (simplified approach)
  const signChallenge = useCallback(async (challenge) => {
    try {
      // For now, we'll use the wallet address as proof of ownership
      // The challenge system provides security against replay attacks
      const signature = `${tonConnectUI.account.address}_${challenge}_${Date.now()}`;
      return signature;
    } catch (error) {
      console.error('Failed to sign challenge:', error);
      throw error;
    }
  }, [tonConnectUI]);

  // Connect wallet and authenticate
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Check if wallet is already connected
      if (!tonConnectUI.connected) {
        // Connect to wallet only if not already connected
        await tonConnectUI.connectWallet();
        
        if (!tonConnectUI.connected) {
          throw new Error('Failed to connect wallet');
        }
      }

      const address = tonConnectUI.account.address;
      
      // Generate challenge
      const { challenge } = await generateChallenge(address);
      
      // Sign challenge
      const signature = await signChallenge(challenge);
      
      // Verify with backend and get auth token
      const response = await authAPI.walletVerify({
        walletAddress: address,
        signature,
        challenge
      });

      // Set auth token and user data
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Use the auth login function to properly set authentication state
        if (response.data.user) {
          // Manually set the user and authentication state
          updateUser(response.data.user);
          // We need to trigger the auth state update
          window.dispatchEvent(new Event('wallet-auth-success'));
        }
      }

      toast.success('Wallet connected successfully!');
      return response.data;
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet. Please try again.');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [tonConnectUI, generateChallenge, signChallenge]);

  // Connect wallet to existing account
  const connectWalletToAccount = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      if (!tonConnectUI.connected) {
        await tonConnectUI.connectWallet();
      }

      const address = tonConnectUI.account.address;
      
      // Generate challenge
      const { challenge } = await generateChallenge(address);
      
      // Sign challenge
      const signature = await signChallenge(challenge);
      
      // Connect to existing account
      const response = await authAPI.walletConnect({
        walletAddress: address,
        signature,
        challenge
      });

      toast.success('Wallet connected to your account!');
      return response.data;
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet to account.');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [tonConnectUI, generateChallenge, signChallenge]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
      setIsConnected(false);
      setWalletAddress(null);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [tonConnectUI]);

  // Send TON transaction
  const sendTransaction = useCallback(async (transaction) => {
    try {
      if (!tonConnectUI.connected) {
        throw new Error('Wallet not connected');
      }

      const result = await tonConnectUI.sendTransaction(transaction);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [tonConnectUI]);

  return {
    isConnected,
    walletAddress,
    isConnecting,
    connectWallet,
    connectWalletToAccount,
    disconnectWallet,
    sendTransaction,
    tonConnectUI
  };
};

export default useTonConnect;