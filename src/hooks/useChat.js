import { useState, useEffect, useCallback } from 'react';
import * as ChatService from '../api/chat';

export const useChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setError(null);
      const session = await ChatService.startSession();
      setSessionId(session.session_id);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to connect to the server');
      setIsConnected(false);
    }
  };

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await ChatService.sendMessage(sessionId, userMessage.content);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  }, []);

  const reconnect = useCallback(() => {
    initializeSession();
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    isConnected,
    error,
    sendMessage,
    clearMessages,
    reconnect
  };
};