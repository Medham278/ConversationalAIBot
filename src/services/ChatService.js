class ChatService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async startSession() {
    try {
      const response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Backend connected:', data);
      return { session_id: 'hf-session-' + Date.now() };
    } catch (error) {
      console.error('Backend connection failed:', error);
      throw error; // Don't fall back to mock, let user know backend is down
    }
  }

  async sendMessage(sessionId, message) {
    try {
      console.log('Sending message to HF backend:', message);
      
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HF API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('HF API Response:', data);
      
      if (data.response) {
        return { answer: data.response };
      } else {
        throw new Error('No response from HF API');
      }
    } catch (error) {
      console.error('Failed to send message to HF backend:', error);
      throw error; // Don't use mock responses, show the error
    }
  }

  async getMetrics() {
    return {
      active_sessions: 1,
      avg_response_time_ms: 250,
      error_rate: '0%'
    };
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/`);
      return await response.json();
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}

export default new ChatService();