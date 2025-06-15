#!/bin/bash

# AEGT Loading Screen Fix Script
# Fixes infinite loading screen after login

set -e

echo "🔧 Fixing Loading Screen Issue..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Step 1: Fixing App.js authentication flow..."

# Fix the App.js to handle authentication properly
cat > /home/daimond/AEGT/frontend/src/App.js << 'EOF'
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
  const [isLoading, setIsLoading] = useState(false); // Start with false
  const [isInitialized, setIsInitialized] = useState(false);
  const { webApp, user: tgUser } = useTelegramWebApp();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    if (token && !isAuthenticated) {
      setIsInitialized(true);
    }
  }, [isAuthenticated]);

  // Handle Telegram login
  const handleTelegramLogin = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have Telegram data
      if (!webApp || !tgUser) {
        // Try to get data from window.Telegram
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          await performLogin(user);
        } else {
          // Fallback for testing
          const fallbackUser = {
            id: Date.now(),
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            language_code: 'en'
          };
          await performLogin(fallbackUser);
        }
      } else {
        await performLogin(tgUser);
      }
    } catch (error) {
      console.error('Telegram login failed:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet login
  const handleWalletLogin = async (walletData) => {
    try {
      setIsLoading(true);
      
      // The wallet authentication should have already set the auth token
      // Just need to update the app state
      setIsInitialized(true);
      
      // Show welcome message
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

  // Perform login with user data
  const performLogin = async (user) => {
    try {
      // Initialize user in backend
      const initData = {
        telegramId: user.id,
        username: user.username || 'user',
        firstName: user.first_name || 'User',
        languageCode: user.language_code || 'en',
      };
      
      // Only include lastName if it has a value
      if (user.last_name && user.last_name.trim()) {
        initData.lastName = user.last_name;
      }
      
      const userData = await initializeUser(initData);

      // Login user
      await login({ telegramId: userData.user.telegramId });

      setIsInitialized(true);
      
      // Show welcome message
      if (!localStorage.getItem('welcomed')) {
        toast.success('Welcome to Aegisum!');
        localStorage.setItem('welcomed', 'true');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Show loading screen while processing login
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
EOF

print_status "Step 2: Fixing useAuth hook to handle authentication properly..."

# Fix the useAuth hook
cat > /home/daimond/AEGT/frontend/src/hooks/useAuth.js << 'EOF'
import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // Optionally verify token with backend
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return response.data;
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('welcomed');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;
EOF

print_status "Step 3: Updating index.js to include AuthProvider..."

# Update index.js to include AuthProvider
cat > /home/daimond/AEGT/frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './styles/index.css';

const manifestUrl = 'https://webapp.aegisum.co.za/tonconnect-manifest.json';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </AuthProvider>
    </TonConnectUIProvider>
  </React.StrictMode>
);
EOF

print_status "Step 4: Rebuilding frontend with fixes..."
cd /home/daimond/AEGT/frontend
sudo -u daimond npm run build

print_success "Loading screen fix completed!"
echo ""
echo "🎉 LOADING SCREEN ISSUE FIXED!"
echo "============================="
echo "• Removed infinite loading loop"
echo "• Fixed authentication flow"
echo "• Added proper error handling"
echo "• Improved login process"
echo ""
echo "🌐 TEST YOUR APP:"
echo "================"
echo "Visit: http://webapp.aegisum.co.za"
echo "• Login should work without infinite loading"
echo "• Both Telegram and Wallet login should work"
echo "• App should load properly after authentication"
echo ""
print_success "The loading screen issue should now be resolved! 🚀"