import React, { useState, useRef, useEffect } from 'react';
import api, { getApiData, getApiErrorMessage } from '../services/api';
import Header from '../components/Header';
import ChatMessage from '../components/ChatMessage';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
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
    if (!input.trim()) return;

    const userMessage = { text: input.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: userMessage.text });
      const data = getApiData(response.data) || {};
      const replyText = typeof data.reply === 'string' ? data.reply : '';
      const fallbackText = typeof data.message === 'string' ? data.message : '';

      setMessages(prev => [
        ...prev,
        { text: replyText || fallbackText || 'Chat service unavailable', sender: 'ai' },
      ]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errorMessage = getApiErrorMessage(error, 'Sorry, something went wrong. Please try again.');
      setMessages(prev => [...prev, { text: errorMessage, sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.header}>
        <h1>AI Chatbot</h1>
      </div>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            style={{
              ...styles.message,
              ...(msg?.sender === 'user' ? styles.userMessage : styles.botMessage),
            }}
          />
        ))}
        {loading && (
          <div style={{ ...styles.message, ...styles.botMessage, ...styles.loadingMessage }}>
            Typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={styles.input}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          style={styles.button}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '20px',
    wordWrap: 'break-word',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: 'white',
    whiteSpace: 'pre-wrap',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    color: 'black',
    whiteSpace: 'normal',
  },
  loadingMessage: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    display: 'flex',
    padding: '20px',
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    outline: 'none',
    fontSize: '16px',
  },
  button: {
    marginLeft: '10px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default Chatbot;
