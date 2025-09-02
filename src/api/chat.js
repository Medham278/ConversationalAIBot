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
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          return_full_text: false,
          max_new_tokens: 100,
          temperature: 0.7,
          do_sample: true
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let botResponse = '';
    
    if (Array.isArray(data) && data.length > 0) {
      if (data[0].generated_text) {
        botResponse = data[0].generated_text.trim();
      } else if (data[0].text) {
        botResponse = data[0].text.trim();
      }
    } else if (data.generated_text) {
      botResponse = data.generated_text.trim();
    }

    if (!botResponse) {
      botResponse = "I understand your message. Could you tell me more about what you'd like to discuss?";
    }

    return { answer: botResponse };
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    return { answer: `API Error: ${error.message}. Please check your API key configuration.` };
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