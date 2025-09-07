'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AssistantPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI travel assistant. How can I help you plan your next adventure?'
    }
  ]);

  const quickQuestions = [
    'What\'s the best time to visit Paris?',
    'How much should I budget for a week in Tokyo?',
    'What are the must-see attractions in New York?',
    'Can you suggest a 3-day itinerary for Rome?'
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');

    // Add loading message
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: 'Thinking...'
    };
    setChatHistory(prev => [...prev, loadingMessage]);

    try {
      // Call AI Assistant API
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Replace loading message with AI response
        setChatHistory(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: result.data.response }
            : msg
        ));
      } else {
        // Replace loading message with error
        setChatHistory(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        ));
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      // Replace loading message with error
      setChatHistory(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
          : msg
      ));
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">AI Travel Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Chat with AI Assistant</h2>
            <p className="text-gray-600">Ask me anything about travel planning, destinations, or trip advice!</p>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Questions</h3>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
