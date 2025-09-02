import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Activity } from 'lucide-react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('demo-session-' + Date.now());
  const [isConnected, setIsConnected] = useState(true);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    avgResponseTime: 250,
    sessionDuration: 0
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMockResponse = (message) => {
    const responses = {
      'hello': 'Hello! How can I assist you today?',
      'help': 'I can help you with various tasks including answering questions, providing information, and having conversations. What would you like to know?',
      'capabilities': 'I can assist with:\n• Answering questions\n• Providing explanations\n• Having conversations\n• Helping with problem-solving\n• And much more!',
      'what can you do': 'I\'m an AI assistant capable of helping with a wide range of tasks. I can answer questions, explain concepts, help with analysis, and engage in meaningful conversations.',
      'default': 'I understand you\'re asking about "' + message + '". While I don\'t have a specific response for that right now, I\'m here to help! Could you provide more details or ask something else?'
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(responses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return value;
      }
    }
    return responses.default;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      const response = getMockResponse(userMessage.content);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Update metrics
      setMetrics(prev => ({
        totalMessages: prev.totalMessages + 1,
        avgResponseTime: Math.round(250 + Math.random() * 200),
        sessionDuration: prev.sessionDuration + 1
      }));

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting to the server. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <Bot className="header-icon" />
            <h1>Conversational AI Bot</h1>
          </div>
          <div className="header-right">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'bot' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="message-content">
                  <div className={`message-bubble ${message.isError ? 'error' : ''}`}>
                    {message.content}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="message-input"
                rows="1"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="metrics-panel">
            <div className="panel-header">
              <Activity size={18} />
              <h3>Session Metrics</h3>
            </div>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Messages</span>
                <span className="metric-value">{metrics.totalMessages}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Avg Response</span>
                <span className="metric-value">{metrics.avgResponseTime}ms</span>
              </div>
              <div className="metric">
                <span className="metric-label">Session ID</span>
                <span className="metric-value session-id">
                  {sessionId ? sessionId.slice(0, 8) + '...' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="panel-header">
              <Settings size={18} />
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button 
                className="action-button"
                onClick={() => setInputMessage("What can you help me with?")}
              >
                Get Help
              </button>
              <button 
                className="action-button"
                onClick={() => setInputMessage("Tell me about your capabilities")}
              >
                Capabilities
              </button>
              <button 
                className="action-button"
                onClick={() => {
                  setMessages([{
                    id: 1,
                    type: 'bot',
                    content: 'Hello! I\'m your AI assistant. How can I help you today?',
                    timestamp: new Date()
                  }]);
                  setMetrics({ totalMessages: 0, avgResponseTime: 250, sessionDuration: 0 });
                }}
              >
                Clear Chat
              </button>
            </div>
          </div>

          <div className="info-panel">
            <h4>Demo Mode</h4>
            <p>Running in demo mode with mock responses</p>
            <p className="info-note">
              Backend URL: <code>http://localhost:8000</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;