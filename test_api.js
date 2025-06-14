// Simple test to verify API endpoints
const axios = require('axios');

const API_BASE = 'https://webapp.aegisum.co.za/api';

async function testAPI() {
  console.log('Testing API endpoints...\n');
  
  // Test health endpoint
  try {
    const healthResponse = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Health check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test initialize endpoint with sample data
  try {
    const initResponse = await axios.post(`${API_BASE}/auth/initialize`, {
      telegramId: 1651155083,
      username: 'daimondsteel259',
      firstName: 'Daimondsteel259',
      lastName: '',
      languageCode: 'en'
    });
    console.log('✅ Initialize endpoint:', initResponse.data);
  } catch (error) {
    console.log('❌ Initialize failed:', error.response?.data || error.message);
  }
  
  // Test auth/me endpoint (should fail without token)
  try {
    const meResponse = await axios.get(`${API_BASE}/auth/me`);
    console.log('✅ Auth/me endpoint:', meResponse.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Auth/me correctly requires authentication');
    } else {
      console.log('❌ Auth/me unexpected error:', error.response?.data || error.message);
    }
  }
}

testAPI().catch(console.error);