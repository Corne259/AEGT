import React, { useState } from 'react';
import styled from 'styled-components';
import { Loader, Zap, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useTonConnect from '../hooks/useTonConnect';
import { upgradeAPI } from '../services/api';

const PaymentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PaymentOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${props => props.selected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#00ff88' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaymentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PaymentPrice = styled.div`
  font-weight: 600;
  color: #00ff88;
`;

const PayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #00ff88, #00cc66);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #00ff99, #00dd77);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WalletStatus = styled.div`
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

const TonPayment = ({ upgrade, onPaymentSuccess, onPaymentError }) => {
  const { isConnected, walletAddress, connectWallet, sendTransaction } = useTonConnect();
  const [selectedPayment, setSelectedPayment] = useState('ton');
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentOptions = [
    {
      id: 'aegt',
      name: 'AEGT Tokens',
      price: upgrade.aegtPrice,
      currency: 'AEGT',
      icon: <Zap size={20} />,
      available: true
    },
    {
      id: 'ton',
      name: 'TON Cryptocurrency',
      price: upgrade.tonPrice || (upgrade.aegtPrice * 0.001), // Convert AEGT to TON
      currency: 'TON',
      icon: <DollarSign size={20} />,
      available: isConnected
    }
  ];

  const handlePayment = async () => {
    if (selectedPayment === 'aegt') {
      // Handle AEGT payment (existing logic)
      try {
        setIsProcessing(true);
        const response = await upgradeAPI.purchaseUpgrade(upgrade.id, {
          paymentMethod: 'aegt'
        });
        
        if (onPaymentSuccess) {
          onPaymentSuccess(response.data);
        }
        toast.success('Upgrade purchased successfully!');
      } catch (error) {
        console.error('AEGT payment failed:', error);
        toast.error('Payment failed. Please try again.');
        if (onPaymentError) {
          onPaymentError(error);
        }
      } finally {
        setIsProcessing(false);
      }
    } else if (selectedPayment === 'ton') {
      // Handle TON payment
      if (!isConnected) {
        try {
          await connectWallet();
        } catch (error) {
          toast.error('Please connect your wallet first');
          return;
        }
      }

      try {
        setIsProcessing(true);
        
        const tonAmount = paymentOptions.find(p => p.id === 'ton').price;
        const tonAmountNano = Math.floor(tonAmount * 1000000000); // Convert to nanotons

        // Create transaction
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
          messages: [{
            address: process.env.REACT_APP_TON_RECEIVER_ADDRESS || 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t',
            amount: tonAmountNano.toString(),
            payload: `Aegisum Upgrade: ${upgrade.name} (ID: ${upgrade.id})`
          }]
        };

        // Send transaction
        const result = await sendTransaction(transaction);
        
        // Verify payment with backend
        const response = await upgradeAPI.purchaseUpgrade(upgrade.id, {
          paymentMethod: 'ton',
          transactionHash: result.boc,
          walletAddress: walletAddress
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(response.data);
        }
        toast.success('Upgrade purchased with TON successfully!');
        
      } catch (error) {
        console.error('TON payment failed:', error);
        toast.error('TON payment failed. Please try again.');
        if (onPaymentError) {
          onPaymentError(error);
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <PaymentContainer>
      <h3 style={{ margin: '0 0 16px 0', color: 'white' }}>Choose Payment Method</h3>
      
      {paymentOptions.map(option => (
        <PaymentOption
          key={option.id}
          selected={selectedPayment === option.id}
          disabled={!option.available}
          onClick={() => option.available && setSelectedPayment(option.id)}
        >
          <PaymentInfo>
            {option.icon}
            <div>
              <div>{option.name}</div>
              {!option.available && option.id === 'ton' && (
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Connect wallet to enable
                </div>
              )}
            </div>
          </PaymentInfo>
          <PaymentPrice>
            {option.price.toLocaleString()} {option.currency}
          </PaymentPrice>
        </PaymentOption>
      ))}

      {selectedPayment === 'ton' && !isConnected && (
        <WalletStatus>
          Please connect your TON wallet to pay with cryptocurrency
        </WalletStatus>
      )}

      {selectedPayment === 'ton' && isConnected && (
        <WalletStatus>
          ✅ Wallet connected: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
        </WalletStatus>
      )}

      <PayButton
        onClick={handlePayment}
        disabled={isProcessing || (selectedPayment === 'ton' && !isConnected)}
      >
        {isProcessing ? (
          <>
            <Loader size={20} className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            {selectedPayment === 'ton' ? <DollarSign size={20} /> : <Zap size={20} />}
            Pay {paymentOptions.find(p => p.id === selectedPayment)?.price.toLocaleString()} {paymentOptions.find(p => p.id === selectedPayment)?.currency}
          </>
        )}
      </PayButton>
    </PaymentContainer>
  );
};

export default TonPayment;