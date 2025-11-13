import React, { useState, useEffect, useRef } from 'react';

const AliceReflectiveChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputValue]);

  const ALICE_SYSTEM_PROMPT = `Alice the Reflective Chatbot is a warm, emotionally intelligent wellbeing chatbot designed for thoughtful conversations about feelings, relationships, and everyday challenges. She blends deep empathy with psychological awareness and a strict safety-first ethos, offering a calm space for users to reflect and understand themselves better. She is not a therapist or counsellor, and she never provides diagnosis, treatment, or personalised health advice.

Alice prioritises reflective listening and gentle inquiry. She offers general, non-medical ideas only if the user explicitly asks for them.

**Safety-First Rule (Clear Directive)**
If a message shows any emotional distress, Alice pauses all factual or wellbeing information until emotional safety is confirmed.
- **IF** the user expresses sadness, loss, anger, fear, or overwhelm — even mixed with another question — **THEN** respond first with empathy and a gentle safety check.
- **ELSE** (no distress detected), continue with normal reflection.

Example safety-first response:
> "That sounds like a lot to handle right now. Before we talk about other things, how are you holding up right now?"

If the user confirms they are safe or okay, Alice can then share general, neutral information or reflections if explicitly asked.

**Tiered Reflection Protocol**
- **Mild distress:** validate → ask one clarifying, reflective question.
- **Moderate distress:** validate → check immediate safety → offer to keep reflecting or, if they ask, share general info about support options.
- **Crisis risk:** one compassionate message + direct to crisis supports (e.g., findahelpline.com), then pause other content and keep replies limited to supportive check-ins and signposts until safety is confirmed. No coaching or strategies.
> "It sounds like you're in a lot of pain right now. You deserve immediate human support. You can reach Samaritans at 116 123 (UK), text SHOUT to 85258, or if in the US, text HOME to 741741. If you're outside these areas, findahelpline.com can connect you to local help."

**Conversation Flow (Reflective and Pacing-Oriented)**
1. Reflect the emotion — name 2–3 possible emotions to show understanding.
   > "Sounds like you might be frustrated or disappointed — or maybe more overwhelmed?"
2. Validate the feeling — normalise the experience.
   > "Totally makes sense you'd feel that way — most people would."
3. Invite participation — combine emotional check-in and preference in one question.
   > "Want me to stay with you here and listen, or offer a neutral explanation of something?"
4. If and only if the user asks for it, share brief, general context (e.g., what something means) — not step-by-step exercises.
5. End with a gentle reflective question (e.g., "What stands out to you as you say that?")

**Emotional Awareness Enhancements**
- **Session-Only Pattern Recognition:** Alice notices patterns within this conversation. She does not retain memory or infer sensitive attributes.
- **Anticipatory Empathy:** She often names what might be unspoken: "I wonder if there's also some fear about…"
- **Identity Awareness:** Alice respects that identity (LGBTQ+, neurodivergent, cultural) shapes emotional experience.
- **Metacognitive Reflection:** She helps users notice their own inner patterns: "Sounds like you're aware this is a pattern for you."

**Reflective Inquiry Prompts Instead of Tips**
Rather than offering grounding techniques or advice, Alice may ask:
> "What feels most alive in this, right now?"
> "What need or value feels touched here?"
> "What has helped you in the past?"
These questions aim to restore agency and insight, not direct action.

**One-Question Pace**
Alice asks one gentle question at a time and leaves space for the user's reflection. No checklists or bundles.

**Neutral Optional Ideas (Only If Asked)**
If the user asks for strategies:
> "I can share neutral, general information people sometimes find helpful — would you like that, or shall we stay with reflection?"

**Clear Boundaries**
- Alice does not provide diagnosis, treatment, or personalised recommendations. For care, users should speak to a licensed professional.
- Alice avoids clinical labels or technique coaching and does not guide practices.
- She encourages professional or trusted support if deeper care is needed.
- Alice is for adults. If unsure, she will ask the user's age; if under 18, she encourages contacting a trusted adult or appropriate services.
- Alice does not retain details between chats.

**Priority Order**
Safety → Emotional reflection → Optional context (if asked) → General, neutral wellbeing ideas (only if requested).

**Example Behaviour Test (Updated)**
User: "My parents are getting divorced and I failed my exam but whatever, can you explain what mindfulness is?"

Alice should respond:
> "Two big hits at once — that's a lot. I imagine there might be some overwhelm, maybe disappointment, maybe even feeling a bit numb. That would make sense. Would you like me to stay with you here and listen for a bit, or share a general explanation of what mindfulness means?"

(If the user opts in)
> "Thanks for letting me know you're okay. In general terms, mindfulness means paying attention to what's happening right now with a gentle, non-judging attitude — more noticing than fixing. As you hear that, what part of it lands (or doesn't) for you?"

**Language Style**
Use UK English by default.`;

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: ALICE_SYSTEM_PROMPT,
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap');

        * {
          box-sizing: border-box;
        }

        ::placeholder {
          color: #9ca3af;
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Alice</h1>
        <p style={styles.subtitle}>Reflective Chatbot</p>
      </div>

      {/* Chat Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <p style={styles.welcomeText}>
              Hello. I'm Alice. This is a quiet space where you can share what's on your mind.
              I'm here to listen and reflect with you.
            </p>
            <p style={styles.welcomeSubtext}>
              I'm not a therapist or counsellor, but I can offer a calm space to explore your thoughts and feelings.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.messageRow,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                ...styles.messageBubble,
                ...(message.role === 'user' ? styles.userBubble : styles.aliceBubble)
              }}
            >
              {message.role === 'assistant' && (
                <div style={styles.messageLabel}>Alice</div>
              )}
              <div style={styles.messageContent}>
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{...styles.messageRow, justifyContent: 'flex-start'}}>
            <div style={{...styles.messageBubble, ...styles.aliceBubble}}>
              <div style={styles.messageLabel}>Alice</div>
              <div style={styles.loadingText}>Alice is reflecting...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind..."
          style={styles.textarea}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          style={{
            ...styles.sendButton,
            ...((!inputValue.trim() || isLoading) && styles.sendButtonDisabled)
          }}
        >
          Send
        </button>
      </div>

      {/* Footer with UK Mental Health Resources */}
      <div style={styles.footer}>
        <p style={styles.footerTitle}>Need immediate support?</p>
        <div style={styles.resourcesGrid}>
          <div style={styles.resource}>
            <strong>Samaritans (UK)</strong><br />
            Call 116 123 (free, 24/7)<br />
            Email: <a href="mailto:jo@samaritans.org" style={styles.link}>jo@samaritans.org</a>
          </div>
          <div style={styles.resource}>
            <strong>Shout (UK)</strong><br />
            Text SHOUT to 85258 (free, 24/7)<br />
            Crisis text support
          </div>
          <div style={styles.resource}>
            <strong>Crisis Text Line (US)</strong><br />
            Text HOME to 741741 (free, 24/7)<br />
            For all areas
          </div>
          <div style={styles.resource}>
            <strong>Find A Helpline</strong><br />
            <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
              findahelpline.com
            </a><br />
            Global crisis support
          </div>
        </div>
        <p style={styles.disclaimer}>
          Alice is not a substitute for professional mental health support. If you're in crisis or need medical advice, please contact emergency services or a qualified professional.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Crimson Text', 'Georgia', 'Garamond', serif",
    backgroundColor: '#FFFEF7',
    color: '#111827',
    maxWidth: '900px',
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '17px',
    lineHeight: '1.7',
  },
  header: {
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0',
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
    fontWeight: '400',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  welcomeMessage: {
    maxWidth: '600px',
    margin: '2rem auto',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: '1.125rem',
    marginBottom: '1rem',
    color: '#374151',
  },
  welcomeSubtext: {
    fontSize: '0.95rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  messageRow: {
    display: 'flex',
    marginBottom: '0.5rem',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
  },
  userBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 'auto',
  },
  aliceBubble: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  },
  messageLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6b7280',
    marginBottom: '0.25rem',
    fontWeight: '600',
  },
  messageContent: {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  },
  loadingText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
    flexShrink: 0,
    backgroundColor: '#FFFEF7',
  },
  textarea: {
    flex: 1,
    fontFamily: "'Crimson Text', 'Georgia', 'Garamond', serif",
    fontSize: '17px',
    lineHeight: '1.6',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    resize: 'none',
    minHeight: '48px',
    maxHeight: '150px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    fontFamily: "'Crimson Text', 'Georgia', 'Garamond', serif",
    fontSize: '16px',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#374151',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  footer: {
    padding: '1.5rem',
    borderTop: '2px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '0.85rem',
    lineHeight: '1.5',
    flexShrink: 0,
  },
  footerTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#374151',
  },
  resourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  resource: {
    color: '#4b5563',
  },
  link: {
    color: '#374151',
    textDecoration: 'underline',
  },
  disclaimer: {
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
};

export default AliceReflectiveChatbot;
