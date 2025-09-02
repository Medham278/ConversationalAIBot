// src/api/chat.js

// Models optimized for question-answering and conversation
const workingModels = [
  "microsoft/DialoGPT-medium",
  "microsoft/DialoGPT-small",
  "facebook/blenderbot-400M-distill",
  "microsoft/DialoGPT-large",
  "gpt2",
  "distilgpt2",
  "facebook/blenderbot_small-90M"
];

export async function startSession() {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  return { session_id: sessionId };
}

async function tryHuggingFaceAPI(message) {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!apiKey || apiKey === 'hf_your_token_here' || apiKey.trim() === '') {
    console.log('No Hugging Face API key found');
    return null;
  }

  // Try each model until one works
  for (const modelName of workingModels) {
    try {
      console.log(`Trying model: ${modelName} with message: "${message}"`);
      
      let requestBody;
      
      // Different request formats for different model types
      if (modelName.includes('DialoGPT')) {
        requestBody = {
          inputs: message,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        };
      } else if (modelName.includes('blenderbot')) {
        requestBody = {
          inputs: message,
          parameters: {
            max_new_tokens: 60,
            temperature: 0.7,
            do_sample: true
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        };
      } else if (modelName.includes('distilgpt2')) {
        requestBody = {
          inputs: `Human: ${message}\nAI:`,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.8,
            do_sample: true,
            return_full_text: false
          }
        };
      } else {
        // For GPT-2 and similar models
        requestBody = {
          inputs: `Human: ${message}\nAI:`,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false,
            stop: ["\n", "Question:"]
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        };
      }

      const response = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`Response status for ${modelName}:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`Response data for ${modelName}:`, data);
        
        let botResponse = '';
        
        // Handle different response formats
        if (modelName.includes('DialoGPT')) {
          if (Array.isArray(data) && data[0]?.generated_text) {
            botResponse = data[0].generated_text;
          } else if (data.generated_text) {
            botResponse = data.generated_text;
          }
        } else if (Array.isArray(data) && data.length > 0) {
          if (data[0].generated_text !== undefined) {
            botResponse = data[0].generated_text;
          } else if (data[0].text) {
            botResponse = data[0].text;
          }
        } else if (data.generated_text) {
          botResponse = data.generated_text;
        }

        // Clean up the response
        if (botResponse && typeof botResponse === 'string') {
          // Remove the input prompt if it's included
          botResponse = botResponse.replace(`Human: ${message}\nAI:`, '').trim();
          botResponse = botResponse.replace(message, '').trim();
          botResponse = botResponse.replace(/^(Human:|AI:)/, '').trim();
          
          // Remove common artifacts
          botResponse = botResponse.replace(/^[:\-\s]+/, '').trim();
          
          // Ensure we have a meaningful response
          if (botResponse.length > 3 && !botResponse.toLowerCase().includes('error')) {
            console.log(`Success with ${modelName}: "${botResponse}"`);
            return botResponse;
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`Model ${modelName} failed with status ${response.status}:`, errorText);
      }
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error);
      continue;
    }
  }
  
  console.log('All Hugging Face models failed');
  return null;
}

export async function sendMessage(sessionId, message) {
  try {
    console.log('Sending message:', message);
    
    // Try Hugging Face API first
    let apiResponse = await tryHuggingFaceAPI(message);
    
    if (apiResponse) {
      return { 
        answer: apiResponse.text,
        model: apiResponse.model
      };
    }

    // If all models fail, use intelligent fallback responses
    console.log('Falling back to informative response');
    
    return getIntelligentFallback(message);

  } catch (error) {
    console.error('Complete API failure:', error);
    
    return getIntelligentFallback(message);
  }
}

function getIntelligentFallback(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greetings
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    const greetings = [
      "Hello! I'm here to help you with any questions you might have.",
      "Hi there! What would you like to know today?",
      "Hey! I'm ready to assist you. What's on your mind?",
      "Hello! Feel free to ask me anything you'd like to know."
    ];
    return {
      answer: greetings[Math.floor(Math.random() * greetings.length)],
      model: "smart-fallback"
    };
  }
  
  // How are you
  if (lowerMessage.includes('how are you')) {
    return {
      answer: "I'm doing well, thank you for asking! I'm here and ready to help you with any questions or topics you'd like to discuss.",
      model: "smart-fallback"
    };
  }
  
  // What questions
  if (lowerMessage.includes('what') && (lowerMessage.includes('can you') || lowerMessage.includes('do you'))) {
    return {
      answer: "I can help you with a wide variety of topics including general knowledge questions, explanations of concepts, current events (though my information has a cutoff date), math problems, and much more. What would you like to know about?",
      model: "smart-fallback"
    };
  }
  
  // Default intelligent responses based on question type
  if (lowerMessage.startsWith('what')) {
    return {
      answer: "That's an interesting question about 'what'. While I'm currently having some connectivity issues with my main AI models, I'd be happy to try to help if you could be more specific about what you'd like to know.",
      model: "smart-fallback"
    };
  }
  
  if (lowerMessage.startsWith('how')) {
    return {
      answer: "You're asking about 'how' something works or is done. I'd love to help explain the process, but I'm currently running on backup responses. Could you try rephrasing your question or being more specific?",
      model: "smart-fallback"
    };
  }
  
  if (lowerMessage.startsWith('why')) {
    return {
      answer: "That's a thoughtful 'why' question. While my main AI models are currently unavailable, I can try to provide some insight if you could give me a bit more context about what you're curious about.",
      model: "smart-fallback"
    };
  }
  
  if (lowerMessage.startsWith('who')) {
    return {
      answer: "You're asking about 'who' - that could be about a person, organization, or character. I'm currently using backup responses, but I might be able to help if you could be more specific about who you're asking about.",
      model: "smart-fallback"
    };
  }
  
  // Conversational responses
  const conversationalResponses = [
    "That's an interesting point. Could you tell me more about what you're thinking?",
    "I understand what you're saying. What would you like to explore further about that topic?",
    "That's a good question. While I'm currently running on backup responses due to API issues, I'm still here to chat. What else would you like to discuss?",
    "I hear you. Even though my main AI models aren't responding right now, I'm still here to have a conversation. What's on your mind?",
    "Interesting! I'm currently using fallback responses, but I'd love to continue our conversation. What would you like to talk about next?"
  ];
  
  return {
    answer: conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)],
    model: "smart-fallback"
  };
}
export async function fetchMetrics() {
  return {
    active_sessions: 1,
    avg_response_time_ms: 850,
    error_rate: '0%'
  };
}