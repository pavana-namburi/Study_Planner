import React from 'react';
import ReactMarkdown from 'react-markdown';

const getSafeText = (value) => (typeof value === 'string' ? value : '');

const ChatMessage = ({ message, style }) => {
  const sender = message?.sender;
  const text = getSafeText(message?.text);
  const isAiMessage = sender === 'ai' || sender === 'bot';

  return (
    <div
      style={style}
      className={`chat-message ${isAiMessage ? 'chat-message-ai' : 'chat-message-user'}`}
    >
      {isAiMessage ? <ReactMarkdown>{text}</ReactMarkdown> : text}
    </div>
  );
};

export default ChatMessage;
