import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

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

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add typing indicator
    setMessages(prev => [...prev, { text: 'Typing...', sender: 'bot' }]);

    try {
      const response = await api.post('/chat', { message: userMessage.text });
      const data = response.data;

      if (data.success && data.reply) {
        // Replace typing with actual reply
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { text: data.reply, sender: 'bot' };
          return newMessages;
        });
      } else {
        // Handle error
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { text: data.message || 'Chat service unavailable', sender: 'bot' };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errorMessage = error.response?.data?.message || 'Sorry, something went wrong. Please try again.';
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { text: errorMessage, sender: 'bot' };
        return newMessages;
      });
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
      <div style={styles.header}>
        <h1>AI Chatbot</h1>
      </div>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage),
            }}
          >
            {msg.text}
          </div>
        ))}
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
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    color: 'black',
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
