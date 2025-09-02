class ChatService {
  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
    this.model = import.meta.env.VITE_HF_MODEL || 'microsoft/DialoGPT-medium';
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.model}`;
    this.sessionContext = new Map(); // Store conversation context locally
  }

  async startSession() {
    const sessionId = this.generateSessionId();
    this.sessionContext.set(sessionId, []);
    
    return {
      session_id: sessionId,
      status: 'active',
      message: 'Session started successfully'
    };
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  async sendMessage(sessionId, message) {
    try {
      // Check if API key is configured
      if (!this.apiKey || this.apiKey === 'hf_your_token_here') {
        return this.getMockResponse(message);
      }

      console.log('Sending message to Hugging Face:', message);
      
      // Get conversation context
      const context = this.sessionContext.get(sessionId) || [];
      
      // Prepare the input with context
      let input = message;
      if (context.length > 0) {
        // Include last few exchanges for context
        const recentContext = context.slice(-6); // Last 3 exchanges (6 messages)
        const contextString = recentContext.map(msg => 
          `${msg.role === 'user' ? 'Human' : 'Bot'}: ${msg.content}`
        ).join('\n');
        input = `${contextString}\nHuman: ${message}\nBot:`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: input,
          parameters: {
            return_full_text: false,
            max_new_tokens: 100,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hugging Face API Error:', response.status, errorText);
        
        // Try to parse error for better user message
        let errorMessage = 'API request failed';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Use default message
        }
        
        return this.getMockResponse(message, `API Error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Hugging Face Response:', data);

      let botResponse = '';
      
      // Parse response based on different possible formats
      if (Array.isArray(data) && data.length > 0) {
        if (data[0].generated_text) {
          botResponse = data[0].generated_text.trim();
        } else if (data[0].text) {
          botResponse = data[0].text.trim();
        }
      } else if (data.generated_text) {
        botResponse = data.generated_text.trim();
      } else if (data.text) {
        botResponse = data.text.trim();
      }

      // Clean up the response
      if (!botResponse) {
        botResponse = "I understand your message. Could you tell me more about what you'd like to discuss?";
      }

      // Remove the input context from response if it's included
      if (botResponse.includes('Human:') || botResponse.includes('Bot:')) {
        const lines = botResponse.split('\n');
        const lastBotLine = lines.reverse().find(line => line.startsWith('Bot:') || (!line.includes('Human:') && line.trim()));
        if (lastBotLine) {
          botResponse = lastBotLine.replace('Bot:', '').trim();
        }
      }

      // Store conversation context
      const currentContext = this.sessionContext.get(sessionId) || [];
      currentContext.push(
        { role: 'user', content: message },
        { role: 'assistant', content: botResponse }
      );
      this.sessionContext.set(sessionId, currentContext);

      return {
        answer: botResponse,
        session_id: sessionId
      };

    } catch (error) {
      console.error('Error calling Hugging Face API:', error);
      return this.getMockResponse(message, `Connection Error: ${error.message}`);
    }
  }

  getMockResponse(message, errorPrefix = '') {
    const mockResponses = [
      "I'm currently running in demo mode. Please add your Hugging Face API key to get AI responses!",
      "Hello! To get real AI responses, please configure your VITE_HUGGING_FACE_API_KEY in the .env file.",
      "I'm a demo response. Add your Hugging Face token to enable actual AI conversations!",
      "Demo mode active! Configure your API key for real Hugging Face model responses."
    ];

    if (errorPrefix) {
      return {
        answer: `${errorPrefix}\n\nFalling back to demo mode. Please check your API configuration.`,
        session_id: 'demo_session'
      };
    }

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return {
      answer: randomResponse,
      session_id: 'demo_session'
    };
  }

  async getMetrics() {
    // Return mock metrics since we don't have a backend
    return {
      active_sessions: this.sessionContext.size,
      total_messages: Array.from(this.sessionContext.values()).reduce((total, context) => total + context.length, 0),
      avg_response_time_ms: 850,
      error_rate: '0%',
      uptime_seconds: Math.floor(Date.now() / 1000),
      api_key_configured: !!(this.apiKey && this.apiKey !== 'hf_your_token_here'),
      model: this.model
    };
  }

  async healthCheck() {
    return {
      status: 'connected',
      message: 'Frontend-only mode with direct Hugging Face API calls',
      api_configured: !!(this.apiKey && this.apiKey !== 'hf_your_token_here')
    };
  }
}

export default new ChatService();