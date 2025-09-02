class ChatService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async startSession() {
    try {
      console.log('Starting new chat session...');
      const response = await fetch(`${this.baseURL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start session: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Session started successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async sendMessage(sessionId, message) {
    try {
      console.log('Sending message:', message);
      
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
        console.error('Backend Error:', errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      return { answer: data.answer };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  async getMetrics() {
    try {
      const response = await fetch(`${this.baseURL}/admin/metrics`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get metrics:', error);
    }
    return {
      active_sessions: 0,
      avg_response_time_ms: 0,
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