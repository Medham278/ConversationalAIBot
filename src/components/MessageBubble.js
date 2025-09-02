import React from 'react';
import { Bot, User } from 'lucide-react';

const MessageBubble = ({ message, isLoading = false }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className={`message ${message.type}`}>
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
  );
};

export default MessageBubble;