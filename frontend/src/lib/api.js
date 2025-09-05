const API_BASE_URL = 'http://169.254.123.26:5000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API: ${options.method || 'GET'} ${url}`);
    
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('❌ API Failed:', error);
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
}

export const api = new ApiClient();