import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there, I'm here to help you get started with mental health support. Thanks for reaching out – that takes courage. I'd love to learn a bit about you and what brings you here today. What's your name?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Clean the message by removing system markers
      let cleanMessage = data.message
        .replace(/CRISIS_DETECTED:.*?\n/g, '')
        .replace(/INTAKE_COMPLETE:.*?\n/g, '')
        .trim();

      setMessages([...newMessages, { role: 'assistant', content: cleanMessage }]);

      if (data.hasCrisis) {
        setShowCrisis(true);
      }

      if (data.isComplete) {
        setIsComplete(true);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      {showCrisis && (
        <div className="crisis-banner">
          <div className="crisis-content">
            <span className="crisis-icon">⚠️</span>
            <div className="crisis-text">
              <strong>Immediate Support Available</strong>
              <div className="crisis-resources">
                <p>If you're in crisis, please reach out now:</p>
                <ul>
                  <li>
                    <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988
                  </li>
                  <li>
                    <strong>Crisis Text Line:</strong> Text HOME to 741741
                  </li>
                  <li>
                    <strong>Emergency Services:</strong> Call 911 or go to nearest ER
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="chat-header">
          <h1>Mental Health Intake</h1>
          <p className="subtitle">A safe space to share your story</p>
          {isComplete && (
            <div className="completion-badge">
              ✓ Intake Complete
            </div>
          )}
        </div>

        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="message-input"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
