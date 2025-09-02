# Conversational AI Bot

A modern, responsive conversational AI bot built with React and Vite, featuring Hugging Face API integration with intelligent fallback responses.

## Features

- 🤖 **Intelligent Chat Interface** - Clean, modern chat UI with typing indicators
- 🔄 **Real-time Messaging** - Smooth message flow with proper state management
- 🏷️ **Model Indicators** - Visual badges showing which AI model responded
- 📊 **Session Metrics** - Track conversation statistics and performance
- 🎨 **Beautiful Design** - Modern glassmorphism UI with smooth animations
- 📱 **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- 🤗 **Hugging Face Integration** - Multiple model fallback system
- ⚡ **Smart Fallbacks** - Conversational responses when API is unavailable

![Demo Screenshot](./public/demo-screenshot.png)

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd conversational-ai-bot
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Configuration

### Hugging Face API (Optional)

To enable AI responses, get a free API key from [Hugging Face](https://huggingface.co/settings/tokens):

1. Create a `.env` file in the root directory
2. Add your API key:
```env
VITE_HUGGING_FACE_API_KEY=hf_your_actual_token_here
```

**Note:** The app works without an API key using intelligent fallback responses.

## AI Models

The app tries multiple Hugging Face models in order:

### Conversational Models
- **microsoft/DialoGPT-medium** - Primary conversational AI
- **microsoft/DialoGPT-small** - Lighter conversational model  
- **microsoft/DialoGPT-large** - Advanced conversational model

### General Purpose Models
- **facebook/blenderbot-400M-distill** - Facebook's conversational AI
- **facebook/blenderbot_small-90M** - Compact BlenderBot
- **gpt2** - OpenAI's GPT-2
- **distilgpt2** - Optimized GPT-2

### Model Indicators

Each response shows which model answered:
- 💬 **MessageSquare** - DialoGPT models
- 🖥️ **Cpu** - GPT-2 models  
- ⚡ **Zap** - BlenderBot models
- 🤖 **Bot** - Fallback responses

## Project Structure

```
src/
├── components/          # Reusable UI components
├── api/                # API service layer
│   └── chat.js         # Hugging Face API integration
├── hooks/              # Custom React hooks
│   └── useChat.js      # Chat state management
├── App.jsx             # Main application component
├── App.css             # Application styles
└── main.jsx            # Application entry point
```

## Features in Detail

### Chat Interface
- Real-time messaging with typing indicators
- Message timestamps and model indicators
- Error handling with user-friendly messages
- Auto-scroll to latest messages

### Session Management
- Automatic session initialization
- Session persistence during conversation
- Connection status monitoring

### Metrics Dashboard
- Real-time session statistics
- Response time tracking
- Message count and session duration

### Fallback System
When Hugging Face API is unavailable, the app provides:
- Conversational responses to greetings
- Question-type aware acknowledgments
- Honest communication about API status
- No hardcoded factual information

## Customization

### Styling
The app uses CSS custom properties for easy theming. Modify variables in `src/App.css`:

```css
:root {
  --primary-color: #3b82f6;
  --background-color: #0f172a;
  --text-color: #f1f5f9;
}
```

### Adding Models
Update the `workingModels` array in `src/api/chat.js` to try different Hugging Face models.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Variables

```env
# Optional: Hugging Face API key
VITE_HUGGING_FACE_API_KEY=hf_your_token_here
```

## Deployment

Build the app for production:

```bash
npm run build
```

The `dist` folder contains the optimized production build ready for deployment to any static hosting service.

## API Integration

The chat service (`src/api/chat.js`) handles:
- Multiple model attempts with automatic fallback
- Response parsing for different model formats
- Intelligent error handling
- Session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with and without API keys
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Troubleshooting

### Common Issues

**Models returning 404 errors:**
- This is normal with Hugging Face's free tier
- The app automatically falls back to conversational responses
- Try getting a Hugging Face API key for better reliability

**Slow responses:**
- Free tier models may take time to "warm up"
- The app shows typing indicators during processing
- Consider upgrading to Hugging Face Pro for faster responses

**No responses:**
- Check browser console for errors
- Verify API key format if using one
- The fallback system should still work without API access