const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Hugging Face API configuration
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_MODEL = process.env.HUGGING_FACE_MODEL || 'microsoft/DialoGPT-medium';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'Hugging Face Chat API Server',
    model: HF_MODEL,
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!HF_API_KEY || HF_API_KEY === 'hf_your_token_here') {
      return res.status(400).json({ 
        error: 'Hugging Face API key not configured. Please add your API key to .env file.' 
      });
    }

    // Call Hugging Face API
    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          past_user_inputs: [],
          generated_responses: [],
          text: message
        },
        parameters: {
          max_length: 1000,
          min_length: 30,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
          repetition_penalty: 1.03
        }
      })
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HF API Error:', errorText);
      throw new Error(`Hugging Face API error: ${hfResponse.status} - ${errorText}`);
    }

    const hfData = await hfResponse.json();
    console.log('HF Response:', hfData);
    let response;
    
    // Handle different response formats
    if (hfData.generated_text) {
      response = hfData.generated_text.trim();
    } else if (Array.isArray(hfData) && hfData[0]?.generated_text) {
      response = hfData[0].generated_text.trim();
    } else if (hfData.conversation && hfData.conversation.generated_responses) {
      response = hfData.conversation.generated_responses[hfData.conversation.generated_responses.length - 1];
    } else {
      console.log('Unexpected HF response format:', hfData);
      response = "I understand your question. Let me help you with that!";
    }

    // Fallback if response is empty
    if (!response || response.length < 2) {
      response = "I'm here to help! Could you please provide more details about what you'd like to know?";
    }

    res.json({
      response: response,
      conversation_id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hugging Face API Error:', error);
    res.status(500).json({
      error: 'Failed to get response from Hugging Face',
      details: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Hugging Face Chat Server running on http://localhost:${port}`);
  console.log(`📝 Using API Key: ${HF_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`🤖 Using model: ${HF_MODEL}`);
});