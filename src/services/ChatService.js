class ChatService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async startSession() {
    try {
      const response = await fetch(`${this.baseURL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Session started:', data);
      return data; // Should contain session_id
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  async sendMessage(sessionId, message) {
    try {
      console.log('Sending message to FastAPI backend:', message);
      
      const response = await fetch(`${this.baseURL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          message: message 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FastAPI Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('FastAPI Response:', data);
      
      if (data.answer) {
        return { answer: data.answer };
      } else {
        throw new Error('No answer from FastAPI backend');
      }
    } catch (error) {
      console.error('Failed to send message to FastAPI backend:', error);
      throw error;
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