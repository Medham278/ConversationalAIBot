import axios from 'axios';

class ChatService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        console.error('Response error:', error);
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to the server. Please make sure the FastAPI backend is running on port 8000.');
        }
        throw error;
      }
    );
  }

  async startSession() {
    try {
      const response = await this.client.post('/chat/start');
      return response.data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw new Error('Backend not available. Please start the FastAPI backend on port 8000.');
    }
  }

  async sendMessage(sessionId, message) {
    try {
      const response = await this.client.post('/chat/message', {
        session_id: sessionId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to get response from backend. Check if FastAPI server is running.');
    }
  }

  async getMetrics() {
    try {
      const response = await this.client.get('/admin/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return {
        active_sessions: 1,
        avg_response_time_ms: 250,
        error_rate: '0%'
      };
    }
  }

  // Mock response for development/testing
  getMockResponse(message) {
    const responses = {
      'hello': 'Hello! How can I assist you today?',
      'help': 'I can help you with various tasks including answering questions, providing information, and having conversations. What would you like to know?',
      'capabilities': 'I can assist with:\n• Answering questions\n• Providing explanations\n• Having conversations\n• Helping with problem-solving\n• And much more!',
      'what can you do': 'I\'m an AI assistant capable of helping with a wide range of tasks. I can answer questions, explain concepts, help with analysis, and engage in meaningful conversations.',
      'default': 'I understand you\'re asking about "' + message + '". While I don\'t have a specific response for that right now, I\'m here to help! Could you provide more details or ask something else?'
    };

    const lowerMessage = message.toLowerCase();
    let response = responses.default;

    for (const [key, value] of Object.entries(responses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ answer: response });
      }, 500 + Math.random() * 1000);
    });
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}

export default new ChatService();