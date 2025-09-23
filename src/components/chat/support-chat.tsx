"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronDown, X, MessageCircle } from 'lucide-react';

const EcommerceChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState('greeting');
  const [aiResponseCount, setAiResponseCount] = useState(0);
  const [ticketData, setTicketData] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const categories = [
    'Order Status',
    'Returns & Refunds',
    'Payment Issues',
    'Shipping Information',
    'Other'
  ];

  const presetSolutions = {
    'Order Status': 'To check your order status, please log into your account and navigate to "My Orders" section. There you can track your order using the tracking number provided in your confirmation email. Orders typically process within 24-48 hours.',
    'Returns & Refunds': 'We offer a 30-day return policy for all items. To initiate a return, please visit our Returns Center and enter your order number and email. Once approved, you\'ll receive a prepaid shipping label. Refunds are processed within 5-7 business days after we receive the item.',
    'Payment Issues': 'If you\'re experiencing payment issues, please ensure your card details are correct and you have sufficient funds. We accept Visa, MasterCard, American Express, and PayPal. If the problem persists, try clearing your browser cache or using a different payment method.',
    'Shipping Information': 'We offer standard shipping (5-7 business days) and express shipping (2-3 business days). Free shipping is available on orders over $50. You\'ll receive a tracking number via email once your order ships. International shipping is available to select countries.'
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage("Hey there 👋\nHow can I help you today?", true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (text, isInitial = false) => {
    if (!isInitial) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { text, sender: 'bot', timestamp: new Date() }]);
      }, 1000);
    } else {
      setMessages(prev => [...prev, { text, sender: 'bot', timestamp: new Date() }]);
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'user', timestamp: new Date() }]);
  };

  const handleCategorySelect = (category) => {
    addUserMessage(category);
    
    if (category === 'Other') {
      setCurrentStep('other');
      addBotMessage("I understand you have a different issue. Please describe your problem in your own words, and I'll do my best to help you.");
    } else {
      setCurrentStep('solution');
      addBotMessage(presetSolutions[category]);
      setTimeout(() => {
        addBotMessage("Did this solve your problem? (Please type 'yes' or 'no')");
      }, 2000);
    }
  };

  const handleUserInput = () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim().toLowerCase();
    addUserMessage(inputValue);
    setInputValue('');

    if (currentStep === 'greeting') {
      addBotMessage("Hello there! Welcome to Aroma Beans Coffee! How can I help you today?");
      setTimeout(() => {
        addBotMessage("Please select one of the following categories:");
        setCurrentStep('category-selection');
      }, 1500);
    } else if (currentStep === 'solution') {
      if (userInput === 'yes') {
        addBotMessage("Great! I'm glad I could help. Is there anything else you need assistance with?");
        setCurrentStep('restart');
      } else {
        addBotMessage("I'm sorry the solution didn't help. Let me create a support ticket for you.");
        setCurrentStep('ticket');
        setTimeout(() => {
          addBotMessage("Please provide your name:");
        }, 1500);
      }
    } else if (currentStep === 'other') {
      if (aiResponseCount < 2) {
        // Simulate AI response based on user's description
        const aiResponse = generateAIResponse(inputValue);
        addBotMessage(aiResponse);
        setAiResponseCount(aiResponseCount + 1);
        setTimeout(() => {
          addBotMessage("Did this help resolve your issue? (Please type 'yes' or 'no')");
          setCurrentStep('ai-check');
        }, 2000);
      }
    } else if (currentStep === 'ai-check') {
      if (userInput === 'yes') {
        addBotMessage("Excellent! I'm happy I could assist you. Is there anything else you need help with?");
        setCurrentStep('restart');
      } else {
        if (aiResponseCount >= 2) {
          addBotMessage("I understand the issue persists. Let me create a support ticket for you to get specialized help.");
          setCurrentStep('ticket');
          setTimeout(() => {
            addBotMessage("Please provide your name:");
          }, 1500);
        } else {
          addBotMessage("Let me try another solution. Can you provide more details about your issue?");
          setCurrentStep('other');
        }
      }
    } else if (currentStep === 'ticket') {
      collectTicketInfo(inputValue);
    } else if (currentStep === 'restart') {
      if (userInput.includes('yes')) {
        resetChat();
      } else {
        addBotMessage("Thank you for using our support chat. Have a great day!");
      }
    }
  };

  const generateAIResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('coffee') || lowerQuery.includes('beans')) {
      return "Based on your query about our coffee products, I recommend checking our product catalog for detailed information about our coffee beans selection. Each product page includes origin details, roast profiles, and brewing recommendations. You can also use our coffee finder tool to match beans to your taste preferences.";
    } else if (lowerQuery.includes('account') || lowerQuery.includes('login')) {
      return "For account-related issues, try resetting your password using the 'Forgot Password' link on the login page. Make sure you're using the email address associated with your account. If you continue to have trouble, clear your browser cookies and cache, then try again.";
    } else if (lowerQuery.includes('discount') || lowerQuery.includes('coupon')) {
      return "To apply discount codes, enter them at checkout in the 'Promo Code' field. Make sure the code hasn't expired and meets any minimum purchase requirements. Sign up for our newsletter to receive exclusive discounts and early access to sales.";
    } else {
      return "Based on your description, I recommend checking our Help Center for detailed guides and FAQs. You can also try searching for your specific issue in our knowledge base, which contains solutions to common problems and step-by-step tutorials.";
    }
  };

  const collectTicketInfo = (value) => {
    if (!ticketData.name) {
      setTicketData({ ...ticketData, name: value });
      addBotMessage("Thank you. Please provide your email address:");
    } else if (!ticketData.email) {
      setTicketData({ ...ticketData, email: value });
      addBotMessage("Please provide your order ID (if applicable, otherwise type 'N/A'):");
    } else if (!ticketData.orderId) {
      setTicketData({ ...ticketData, orderId: value });
      addBotMessage("Finally, please provide a brief summary of your issue:");
    } else if (!ticketData.summary) {
      setTicketData({ ...ticketData, summary: value });
      addBotMessage(`Thank you for providing the information. Your support ticket has been created successfully!\n\nTicket Details:\n• Name: ${ticketData.name}\n• Email: ${ticketData.email}\n• Order ID: ${ticketData.orderId}\n• Issue: ${value}\n\nOur support team will contact you within 24 hours.`);
      setCurrentStep('complete');
    }
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentStep('greeting');
    setAiResponseCount(0);
    setTicketData({});
    addBotMessage("Hey there 👋\nHow can I help you today?", true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-20' : 'w-96 h-[600px]'
      } flex flex-col overflow-hidden`}>
        {/* Header */}
        <div 
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Chatbot</h3>
              {!isMinimized && <p className="text-xs opacity-90">We're here to help</p>}
            </div>
          </div>
          <button className="p-1 hover:bg-white/20 rounded transition-colors">
            {isMinimized ? <ChevronDown className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-800 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 shadow-sm">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'category-selection' && !isTyping && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => handleCategorySelect(category)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-full text-sm transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
                  placeholder="Message..."
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
                  disabled={currentStep === 'category-selection' || currentStep === 'complete'}
                />
                <button
                  onClick={handleUserInput}
                  disabled={currentStep === 'category-selection' || currentStep === 'complete'}
                  className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EcommerceChatbot;