// src/components/ui/chat-widget.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'bot';
  message: string;
  timestamp: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Add welcome message when chat opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'bot',
        message: 'Hello! I\'m here to help you with product information, pricing, and orders. How can I assist you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, messages.length]);

  // Handle unread count
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const addBotMessage = (message: string) => {
    const botMessage: ChatMessage = {
      role: 'bot',
      message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, botMessage]);
    
    // Increment unread count if chat is closed or minimized
    if (!isOpen || isMinimized) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      message: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage.message,
          customerEmail: null // You can get this from auth context if user is logged in
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addBotMessage(data.message);

        if (data.escalated) {
          // Show escalation success message after a delay
          setTimeout(() => {
            addBotMessage(`Great! I've created ticket ${data.ticketNumber} for you. Our support team will contact you shortly.`);
          }, 1000);
        }
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addBotMessage('Sorry, I\'m having trouble right now. Please try again or contact our support team directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      setUnreadCount(0);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setUnreadCount(0);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Need help? Chat with us!
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-14' : 'w-80 h-96'
        }`}>
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">Customer Support</h3>
              {isMinimized && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container - Hidden when minimized */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-xs">
                      {/* Message Bubble */}
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                      
                      {/* Timestamp */}
                      <p className={`text-xs text-gray-500 mt-1 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 max-w-xs px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex space-x-1 items-center">
                        <span className="text-xs text-gray-500 mr-2">Typing</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Character count */}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Press Enter to send</span>
                  <span>{inputMessage.length}/500</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setIsMinimized(true)}
        />
      )}
    </>
  );
};

export default ChatWidget;