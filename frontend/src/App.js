import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './pages/LoginPage';
import MiningDashboard from './pages/MiningDashboard';
import UpgradeShop from './pages/UpgradeShop';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import Frens from './pages/Frens';
import Stats from './pages/Stats';

// Hooks
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import { useAuth } from './hooks/useAuth';

// Services
import { initializeUser } from './services/api';

// Styles
import './styles/App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { webApp, user: tgUser } = useTelegramWebApp();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    let initTimeout;
    let hasInitialized = false;
    
    const initializeApp = async () => {
      if (hasInitialized || isInitialized) return; // Prevent multiple initializations
      
      try {
        // Wait for Telegram WebApp to be ready, but with timeout
        if (!webApp || !tgUser) {
          // If we've been waiting too long, try with fallback data
          if (!initTimeout) {
            initTimeout = setTimeout(() => {
              if (!hasInitialized) {
                console.warn('Telegram WebApp not ready, using fallback initialization');
                initializeWithFallback();
              }
            }, 3000); // Reduced to 3 seconds
          }
          return;
        }

        // Clear timeout if we got the data
        if (initTimeout) {
          clearTimeout(initTimeout);
          initTimeout = null;
        }

        hasInitialized = true;

        // Initialize user in backend
        const initData = {
          telegramId: tgUser.id,
          username: tgUser.username || 'user',
          firstName: tgUser.first_name || 'User',
          languageCode: tgUser.language_code || 'en',
        };
        
        // Only include lastName if it has a value
        if (tgUser.last_name && tgUser.last_name.trim()) {
          initData.lastName = tgUser.last_name;
        }
        
        const userData = await initializeUser(initData);

        // Login user (only send telegramId for login)
        await login({ telegramId: userData.user.telegramId });

        setIsInitialized(true);
        // Only show welcome message once
        if (!localStorage.getItem('welcomed')) {
          toast.success('Welcome to Aegisum!');
          localStorage.setItem('welcomed', 'true');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        if (!hasInitialized) {
          toast.error('Failed to initialize app. Please try again.');
          // Try fallback initialization
          initializeWithFallback();
        }
      } finally {
        setIsLoading(false);
      }
    };

    const initializeWithFallback = async () => {
      if (hasInitialized || isInitialized) return; // Prevent multiple initializations
      
      try {
        console.log('Attempting fallback initialization...');
        hasInitialized = true;
        
        // Try to get user data from URL parameters (Telegram WebApp sometimes passes data this way)
        const urlParams = new URLSearchParams(window.location.search);
        const tgWebAppData = urlParams.get('tgWebAppData');
        
        let fallbackUser = {
          id: Date.now(), // Use timestamp as fallback ID
          username: 'user' + Date.now().toString().slice(-6),
          first_name: 'User',
          last_name: '',
          language_code: 'en'
        };

        // If we have Telegram data in URL, try to parse it
        if (tgWebAppData) {
          try {
            const decodedData = decodeURIComponent(tgWebAppData);
            const userData = JSON.parse(decodedData);
            if (userData.user) {
              fallbackUser = userData.user;
            }
          } catch (e) {
            console.warn('Could not parse Telegram WebApp data from URL');
          }
        }

        // Initialize user in backend
        const initData = {
          telegramId: fallbackUser.id,
          username: fallbackUser.username,
          firstName: fallbackUser.first_name,
          languageCode: fallbackUser.language_code || 'en',
        };
        
        // Only include lastName if it has a value
        if (fallbackUser.last_name && fallbackUser.last_name.trim()) {
          initData.lastName = fallbackUser.last_name;
        }
        
        const userData = await initializeUser(initData);

        // Login user (only send telegramId for login)
        await login({ telegramId: userData.user.telegramId });

        setIsInitialized(true);
        // Only show welcome message once
        if (!localStorage.getItem('welcomed')) {
          toast.success('Welcome to Aegisum!');
          localStorage.setItem('welcomed', 'true');
        }
      } catch (error) {
        console.error('Fallback initialization failed:', error);
        if (!hasInitialized) {
          toast.error('Failed to initialize app. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Start initialization only once
    if (!isInitialized && !hasInitialized) {
      if (webApp || tgUser) {
        initializeApp();
      } else {
        // If no Telegram data available, start timeout immediately
        initTimeout = setTimeout(() => {
          if (!hasInitialized) {
            console.warn('No Telegram WebApp detected, using fallback');
            initializeWithFallback();
          }
        }, 2000); // 2 second timeout for fallback
      }
    }

    // Cleanup
    return () => {
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []); // Empty dependency array to run only once

  // Handle Telegram login
  const handleTelegramLogin = () => {
    // This will trigger the existing initialization logic
    if (webApp || tgUser) {
      setIsLoading(true);
      setIsInitialized(false);
    } else {
      toast.error('Please open this app through Telegram');
    }
  };

  // Handle wallet login
  const handleWalletLogin = async (walletData) => {
    try {
      setIsLoading(true);
      // The wallet authentication should have already set the auth token
      // Just need to update the app state
      setIsInitialized(true);
      // Only show welcome message once
      if (!localStorage.getItem('welcomed')) {
        toast.success('Welcome to Aegisum!');
        localStorage.setItem('welcomed', 'true');
      }
    } catch (error) {
      console.error('Wallet login failed:', error);
      toast.error('Wallet login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !isInitialized) {
    return (
      <LoginPage 
        onTelegramLogin={handleTelegramLogin}
        onWalletLogin={handleWalletLogin}
      />
    );
  }

  return (
    <Router>
      <div className="app">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/mining" replace />} />
              <Route 
                path="/mining" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MiningDashboard />
                  </motion.div>
                } 
              />
              <Route 
                path="/upgrade" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <UpgradeShop />
                  </motion.div>
                } 
              />
              <Route 
                path="/wallet" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Wallet />
                  </motion.div>
                } 
              />
              <Route 
                path="/frens" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Frens />
                  </motion.div>
                } 
              />
              <Route 
                path="/stats" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Stats />
                  </motion.div>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Settings />
                  </motion.div>
                } 
              />
            </Route>
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;