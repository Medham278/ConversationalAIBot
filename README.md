# Conversational AI Bot

A modern, responsive conversational AI bot built with React and designed to connect to a FastAPI backend.

## Features

- 🤖 **Intelligent Chat Interface** - Clean, modern chat UI with typing indicators
- 🔄 **Real-time Messaging** - Smooth message flow with proper state management
- 📊 **Session Metrics** - Track conversation statistics and performance
- 🎨 **Beautiful Design** - Modern glassmorphism UI with smooth animations
- 📱 **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- 🔌 **FastAPI Ready** - Built to connect seamlessly with FastAPI backend
- ⚡ **Mock Mode** - Works standalone with mock responses for development

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
npm start
```

The app will open at `http://localhost:3000`

## Backend Integration

This frontend is designed to work with a FastAPI backend. The expected API endpoints are:

- `POST /chat/start` - Initialize a new chat session
- `POST /chat/message` - Send a message and get AI response
- `GET /admin/metrics` - Get session metrics
- `GET /health` - Health check endpoint

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── services/           # API service layer
├── hooks/              # Custom React hooks
├── App.js              # Main application component
├── App.css             # Application styles
└── index.js            # Application entry point
```

## Features in Detail

### Chat Interface
- Real-time messaging with typing indicators
- Message timestamps and status indicators
- Error handling with user-friendly messages
- Auto-scroll to latest messages

### Session Management
- Automatic session initialization
- Session persistence during the conversation
- Connection status monitoring

### Metrics Dashboard
- Real-time session statistics
- Response time tracking
- Message count and session duration

### Mock Mode
The application includes a mock mode that provides realistic responses for development and testing without requiring a backend server.

## Customization

### Styling
The app uses CSS custom properties for easy theming. Modify the CSS variables in `src/App.css`:

```css
:root {
  --primary-color: #3b82f6;
  --background-color: #0f172a;
  --text-color: #f1f5f9;
  /* ... other variables */
}
```

### API Configuration
Update the `ChatService` class in `src/services/ChatService.js` to modify API endpoints or add authentication.

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Testing

The app includes comprehensive error handling and fallback mechanisms:
- Network connectivity issues
- API endpoint failures
- Invalid responses
- Session management errors

## Deployment

Build the app for production:

```bash
npm run build
```

The build folder contains the optimized production build ready for deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.