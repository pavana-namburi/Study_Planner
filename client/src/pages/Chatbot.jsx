import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your AI study assistant. Ask me anything about study tips, scheduling, or motivation! 📚", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { text: trimmed, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: `⚠️ ${data.error || 'Something went wrong.'}`, sender: 'bot' }]);
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
      setMessages(prev => [...prev, { text: '❌ Network error. Please check your connection and try again.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>🤖</span>
          <div>
            <h1 style={styles.headerTitle}>Study Assistant</h1>
            <p style={styles.headerSubtitle}>Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageRow,
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.sender === 'bot' && <div style={styles.botAvatar}>🤖</div>}
            <div
              style={{
                ...styles.message,
                ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage),
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.botAvatar}>🤖</div>
            <div style={{ ...styles.message, ...styles.botMessage }}>
              <div style={styles.typingIndicator}>
                <span style={{ ...styles.dot, animationDelay: '0s' }}></span>
                <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
                <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          id="chatbot-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about study tips, scheduling, motivation..."
          style={styles.input}
          disabled={loading}
          autoComplete="off"
        />
        <button
          id="chatbot-send-btn"
          onClick={handleSend}
          style={{
            ...styles.button,
            ...(loading || !input.trim() ? styles.buttonDisabled : {}),
          }}
          disabled={loading || !input.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {/* Bounce animation style tag */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },

  /* Header */
  header: {
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  headerIcon: {
    fontSize: '2rem',
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    borderRadius: '14px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#f8fafc',
    lineHeight: 1.2,
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: 500,
  },

  /* Messages area */
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },

  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },

  botAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    flexShrink: 0,
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },

  message: {
    maxWidth: '70%',
    padding: '12px 18px',
    borderRadius: '18px',
    wordWrap: 'break-word',
    fontSize: '0.925rem',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },

  userMessage: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    borderBottomRightRadius: '6px',
    boxShadow: '0 2px 12px rgba(37, 99, 235, 0.3)',
  },

  botMessage: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderBottomLeftRadius: '6px',
  },

  /* Typing indicator */
  typingIndicator: {
    display: 'flex',
    gap: '5px',
    padding: '4px 0',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
    display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },

  /* Input area */
  inputContainer: {
    display: 'flex',
    padding: '16px 20px 20px',
    gap: '12px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
    background: 'transparent',
  },

  input: {
    flex: 1,
    padding: '14px 20px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '16px',
    outline: 'none',
    fontSize: '0.95rem',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },

  button: {
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)',
    flexShrink: 0,
  },

  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};

export default Chatbot;