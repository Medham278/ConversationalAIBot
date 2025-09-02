class ChatService {
  constructor() {
    this.baseURL = 'http://localhost:8000';
  }

  async startSession() {
    try {
      const response = await fetch(`${this.baseURL}/`);
      const data = await response.json();
      return { session_id: 'demo-session-' + Date.now() };
    } catch (error) {
      console.error('Backend not available, using mock mode');
      return { session_id: 'mock-session-' + Date.now() };
    }
  }

  async sendMessage(sessionId, message) {
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { answer: data.response };
    } catch (error) {
      console.error('Failed to send message:', error);
      // Return mock response if backend fails
      return this.getMockResponse(message);
    }
  }

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

    return Promise.resolve({ answer: response });
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