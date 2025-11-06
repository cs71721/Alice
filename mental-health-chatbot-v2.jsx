import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Heart } from 'lucide-react';

const MentalHealthIntake = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [riskDetected, setRiskDetected] = useState(false);
  const [intakeComplete, setIntakeComplete] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Start conversation
    setMessages([{
      role: 'assistant',
      content: "Hi there, I'm here to help you get started with mental health support. Thanks for reaching out – that takes courage. I'd love to learn a bit about you and what brings you here today. What's your name?"
    }]);
  }, []);

  const callClaude = async (conversationHistory) => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to display
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);

    try {
      // Build conversation history (skip initial greeting)
      const conversationHistory = [];
      
      // Add system instructions to first user message
      if (updatedMessages.length === 2) {
        conversationHistory.push({
          role: 'user',
          content: `[INSTRUCTIONS: You are a warm, empathetic mental health intake specialist. Conduct a natural conversation to gather: name, age, location, PHQ-9 (9 depression questions about past 2 weeks), GAD-7 (7 anxiety questions about past 2 weeks), risk assessment (suicidal ideation, self-harm, substance use), therapy preferences (CBT/psychodynamic/EMDR, availability, language, budget), and goals. Be conversational, not mechanical. If crisis detected, include **CRISIS_DETECTED**. When complete, include **INTAKE_COMPLETE**.]\n\n${userMessage}`
        });
      } else {
        // Add all messages after the initial greeting
        for (let i = 1; i < updatedMessages.length; i++) {
          conversationHistory.push({
            role: updatedMessages[i].role,
            content: updatedMessages[i].content
          });
        }
      }

      console.log('Calling Claude API with', conversationHistory.length, 'messages');

      const assistantResponse = await callClaude(conversationHistory);

      // Check for markers
      if (assistantResponse.includes('**CRISIS_DETECTED**')) {
        setRiskDetected(true);
      }
      if (assistantResponse.includes('**INTAKE_COMPLETE**')) {
        setIntakeComplete(true);
      }

      // Clean response
      const cleanedResponse = assistantResponse
        .replace(/\*\*CRISIS_DETECTED\*\*/g, '')
        .replace(/\*\*INTAKE_COMPLETE\*\*/g, '')
        .trim();

      setMessages([...updatedMessages, { role: 'assistant', content: cleanedResponse }]);

    } catch (error) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `I'm having trouble connecting. Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mental Health Intake</h1>
            <p className="text-sm text-gray-500">Safe space for conversation</p>
          </div>
        </div>
      </div>

      {/* Crisis Banner */}
      {riskDetected && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-semibold text-red-900 mb-1">Crisis Support Available 24/7</h3>
              <div className="text-red-800 space-y-1">
                <p><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</p>
                <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                <p><strong>Emergency:</strong> Call 911 or go to nearest ER</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Completion Banner */}
      {intakeComplete && (
        <div className="bg-green-50 border-t border-green-200 p-3">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-medium text-green-900">
              ✓ Intake complete. We'll match you with the right support.
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || intakeComplete}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || intakeComplete}
            className="bg-indigo-600 text-white rounded-xl px-6 py-3 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2 max-w-4xl mx-auto">
          Confidential conversation. Take your time and share what feels comfortable.
        </p>
      </div>
    </div>
  );
};

export default MentalHealthIntake;
