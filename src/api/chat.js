// src/api/chat.js
import api from "./client";

export async function startSession() {
  // For frontend-only mode, generate a session ID
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  return { session_id: sessionId };
}

export async function sendMessage(sessionId, message) {
  // Direct Hugging Face API call
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!apiKey || apiKey === 'hf_your_token_here') {
    // Return mock response if no API key
    const mockResponses = [
      "I'm currently running in demo mode. Please add your Hugging Face API key to get AI responses!",
      "Hello! To get real AI responses, please configure your VITE_HUGGING_FACE_API_KEY in the .env file.",
      "I'm a demo response. Add your Hugging Face token to enable actual AI conversations!"
    ];
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return { answer: randomResponse };
  }

  try {
    // Use a more reliable model for text generation
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          past_user_inputs: [],
          generated_responses: [],
          text: message
        },
        parameters: {
          return_full_text: false,
          max_new_tokens: 50,
          temperature: 0.7,
          do_sample: true,
          repetition_penalty: 1.1
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (!response.ok) {
      // If DialoGPT fails, try a simpler text generation model
      const fallbackResponse = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true
          }
        })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const fallbackData = await fallbackResponse.json();
      let botResponse = '';
      
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        botResponse = fallbackData[0].generated_text || fallbackData[0].text || '';
      } else if (fallbackData.generated_text) {
        botResponse = fallbackData.generated_text;
      }

      // Clean up the response
      if (botResponse) {
        botResponse = botResponse.replace(message, '').trim();
      }

      if (!botResponse) {
        botResponse = "I understand your message. Could you tell me more about what you'd like to discuss?";
      }

      return { answer: botResponse };
    }

    const data = await response.json();
    let botResponse = '';
    
    if (data.generated_text) {
      botResponse = data.generated_text.trim();
    } else if (Array.isArray(data) && data.length > 0) {
      if (data[0].generated_text) {
        botResponse = data[0].generated_text.trim();
      } else if (data[0].text) {
        botResponse = data[0].text.trim();
      }
    }

    if (!botResponse) {
      botResponse = "I understand your message. Could you tell me more about what you'd like to discuss?";
    }

    return { answer: botResponse };
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    
    // Provide a helpful fallback response
    const fallbackResponses = [
      "I'm having trouble connecting to the AI service right now. Could you try rephrasing your question?",
      "There seems to be a temporary issue with the AI service. Let me try to help you in a different way.",
      "I'm experiencing some technical difficulties. Could you tell me more about what you're looking for?"
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    return { answer: randomFallback };
  }
}

export async function fetchMetrics() {
  // Return mock metrics for frontend-only mode
  return {
    active_sessions: 1,
    avg_response_time_ms: 850,
    error_rate: '0%'
  };
}