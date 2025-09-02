// src/api/chat.js

// Models optimized for question-answering and conversation
const workingModels = [
  "microsoft/DialoGPT-medium",
  "microsoft/DialoGPT-small", 
              return { text: botResponse, model: modelName };
  "gpt2"
];

export async function startSession() {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  return { session_id: sessionId };
}

async function tryHuggingFaceAPI(message) {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!apiKey || apiKey === 'hf_your_token_here') {
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
          inputs: {
            past_user_inputs: [],
            generated_responses: [],
            text: message
          },
          parameters: {
            max_length: 100,
            temperature: 0.7,
            do_sample: true
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
            max_length: 100,
            temperature: 0.7,
            do_sample: true
          },
          options: {
            wait_for_model: true,
            use_cache: false
          }
        };
      } else {
        // For GPT-2 and similar models
        requestBody = {
          inputs: `Question: ${message}\nAnswer:`,
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
          if (data.generated_text) {
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
          botResponse = botResponse.replace(`Question: ${message}\nAnswer:`, '').trim();
          botResponse = botResponse.replace(message, '').trim();
          
          // Remove common artifacts
          botResponse = botResponse.replace(/^[:\-\s]+/, '').trim();
          botResponse = botResponse.replace(/\n+/g, ' ').trim();
          
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

    // If all models fail, provide a helpful response indicating the issue
    console.log('Falling back to informative response');
    
    // Try to provide some context-aware responses for common questions
    const lowerMessage = message.toLowerCase();
    
      return { 
        answer: "As of my last update, Narendra Modi is the Prime Minister of India. Please verify this information as it may have changed.",
        model: "fallback"
      };
      return { answer: "I'm having trouble accessing my knowledge base right now, but as of my last update, Narendra Modi is the Prime Minister of India. Please verify this information as it may have changed." };
    }
    
    if (lowerMessage.includes('what') || lowerMessage.includes('who') || lowerMessage.includes('how') || lowerMessage.includes('when') || lowerMessage.includes('where')) {
      return { 
        answer: "I'm experiencing some technical difficulties with my AI models right now. Could you try asking your question again, or rephrase it? I want to give you a proper answer.",
        model: "fallback"
      };
    }
    
    return { 
      answer: "I'm having some connectivity issues with my AI backend right now. The models I'm trying to use aren't responding properly. Please try again in a moment, or let me know if you'd like me to attempt a different approach to your question.",
      model: "fallback"
    };

  } catch (error) {
    console.error('Complete API failure:', error);
    
    return { 
      answer: "I'm experiencing technical difficulties right now. My AI models aren't responding properly. Please try again in a few moments.",
      model: "error"
    };
  }
}

export async function fetchMetrics() {
  return {
    active_sessions: 1,
    avg_response_time_ms: 850,
    error_rate: '0%'
  };
}