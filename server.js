const express = require('express');
const cors = require('cors');
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
    const { message, conversation_history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call Hugging Face API
    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9
        }
      })
    });

    if (!hfResponse.ok) {
      throw new Error(`Hugging Face API error: ${hfResponse.status}`);
    }

    const hfData = await hfResponse.json();
    let response;
    
    // Handle different response formats
    if (Array.isArray(hfData) && hfData[0]?.generated_text) {
      response = hfData[0].generated_text.replace(message, '').trim();
    } else if (hfData.generated_text) {
      response = hfData.generated_text.replace(message, '').trim();
    } else {
      response = "I'm here to help! Could you please rephrase your question?";
    }

    // Fallback if response is empty
    if (!response || response.length < 2) {
      response = "I understand your question. Let me help you with that!";
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
  console.log(`📝 Make sure to set your HUGGING_FACE_API_KEY in .env file`);
  console.log(`🤖 Using model: ${HF_MODEL}`);
});