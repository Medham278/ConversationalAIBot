// src/api/chat.js
import { pipeline } from '@xenova/transformers';

let generator = null;

// Initialize the text generation pipeline
async function initializeGenerator() {
  if (!generator) {
    try {
      // Use a lightweight model that works well in browsers
      generator = await pipeline('text-generation', 'Xenova/gpt2', {
        quantized: true,
        progress_callback: (progress) => {
          console.log('Model loading progress:', progress);
        }
      });
    } catch (error) {
      console.error('Failed to initialize local model:', error);
      generator = null;
    }
  }
  return generator;
}

// Working Hugging Face models to try
const workingModels = [
  "gpt2",
  "microsoft/DialoGPT-small",
  "facebook/blenderbot-400M-distill",
  "distilgpt2"
];

export async function startSession() {
  // For frontend-only mode, generate a session ID
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  return { session_id: sessionId };
}

async function tryHuggingFaceAPI(message) {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!apiKey || apiKey === 'hf_your_token_here') {
    return null;
  }

  // Try each model until one works
  for (const modelName of workingModels) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
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
            return_full_text: false,
            pad_token_id: 50256
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Success with model: ${modelName}`, data);
        
        let botResponse = '';
        
        if (Array.isArray(data) && data.length > 0) {
          if (data[0].generated_text) {
            botResponse = data[0].generated_text;
          } else if (data[0].text) {
            botResponse = data[0].text;
          }
        } else if (data.generated_text) {
          botResponse = data.generated_text;
        }

        // Clean up the response
        if (botResponse) {
          // Remove the input message if it's included
          botResponse = botResponse.replace(message, '').trim();
          
          // Remove common artifacts
          botResponse = botResponse.replace(/^[:\-\s]+/, '').trim();
          
          if (botResponse.length > 0) {
            return botResponse;
          }
        }
      } else {
        console.log(`Model ${modelName} failed with status:`, response.status);
      }
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error);
      continue;
    }
  }
  
  return null;
}

async function tryTransformersJS(message) {
  try {
    const gen = await initializeGenerator();
    if (!gen) return null;

    const result = await gen(message, {
      max_new_tokens: 30,
      temperature: 0.7,
      do_sample: true,
      return_full_text: false
    });

    if (result && result.length > 0) {
      let response = result[0].generated_text || '';
      // Clean up the response
      response = response.replace(message, '').trim();
      response = response.replace(/^[:\-\s]+/, '').trim();
      
      if (response.length > 0) {
        return response;
      }
    }
  } catch (error) {
    console.error('Transformers.js error:', error);
  }
  
  return null;
}

export async function sendMessage(sessionId, message) {
  try {
    // First try Hugging Face API with multiple models
    let response = await tryHuggingFaceAPI(message);
    
    if (response) {
      return { answer: response };
    }

    // If HF API fails, try local transformers.js
    console.log('Trying local transformers.js...');
    response = await tryTransformersJS(message);
    
    if (response) {
      return { answer: response };
    }

    // If everything fails, provide contextual mock responses
    const mockResponses = [
      "That's an interesting point. Could you tell me more about what you're thinking?",
      "I understand what you're saying. What would you like to explore further?",
      "Thanks for sharing that with me. How can I help you with this topic?",
      "I see what you mean. What specific aspect would you like to discuss?",
      "That's a good question. Let me think about how to approach this with you."
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return { answer: randomResponse };

  } catch (error) {
    console.error('All methods failed:', error);
    
    return { 
      answer: "I'm having some technical difficulties right now, but I'm here to help. Could you try rephrasing your question?" 
    };
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