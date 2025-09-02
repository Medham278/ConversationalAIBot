const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
  project: process.env.OPENAI_PROJECT_ID || undefined
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    message: 'OpenAI Chat API Server',
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

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    res.json({
      response: response,
      conversation_id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from OpenAI',
      details: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 OpenAI Chat Server running on http://localhost:${port}`);
  console.log(`📝 Make sure to set your OPENAI_API_KEY in .env file`);
});