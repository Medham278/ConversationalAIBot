import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Activity, Cpu, Zap, MessageSquare } from 'lucide-react';
import { useChat } from './hooks/useChat';
import './App.css';

function App() {
  const {
    messages,
    isLoading,
    sessionId,
    isConnected,
    sendMessage,
    clearMessages
  } = useChat();
  
  const [inputMessage, setInputMessage] = useState('');
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage('');

    const startTime = Date.now();

    try {
      await sendMessage(message);
      
      const responseTime = Date.now() - startTime;
      // Update metrics
      setMetrics(prev => ({
        totalMessages: prev.totalMessages + 1,
        avgResponseTime: Math.round((prev.avgResponseTime * prev.totalMessages + responseTime) / (prev.totalMessages + 1)),
        sessionDuration: prev.sessionDuration + 1
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
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
                  clearMessages();
                  setMetrics({ totalMessages: 0, avgResponseTime: 250, sessionDuration: 0 });
                }}
              >
                Clear Chat
              </button>
            </div>
          </div>

          <div className="info-panel">
            <h4>AI Integration Status</h4>
            <p>HF API + Smart Fallbacks</p>
            <div className="info-note">
              <p>🔄 HF Models + Intelligent Responses</p>
              <p>Tries API first, smart fallbacks if needed</p>
              <code>Status: Resilient</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;