import { API_CONFIG } from './config.js';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.API_URL;
    console.log('🔗 API Client initialized with:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache'
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ API Request Failed:', error);
      
      // Network error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot connect to ${this.baseURL}. Make sure backend server is running.`);
      }
      
      throw error;
    }
  }

  async createRoom(roomData) {
    return this.request('/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  }

  async getRoomInfo(roomId) {
    return this.request(`/api/rooms/${roomId}`);
  }

  async checkRoomExists(roomId) {
    return this.request(`/api/rooms/${roomId}/exists`);
  }

  async getRoomMessages(roomId, options = {}) {
    const params = new URLSearchParams(options);
    return this.request(`/api/messages/${roomId}?${params}`);
  }

  async getRoomUsers(roomId) {
    return this.request(`/api/rooms/${roomId}/users`);
  }

  async getNetworkInfo() {
    return this.request('/network');
  }

  // Health check method
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();

// Export config for other components
export { API_CONFIG };