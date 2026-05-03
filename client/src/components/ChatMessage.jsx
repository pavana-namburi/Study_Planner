import React from "react";
import ReactMarkdown from "react-markdown";

const ChatMessage = ({ message }) => {
  const text = typeof message?.text === "string" ? message.text : "";
  const isUser = message?.sender === "user";

  return (
    <div
      className={`chat-message-row ${isUser ? "chat-message-row-user" : "chat-message-row-ai"}`}
    >
      <div
        className={`chat-message-bubble ${isUser ? "chat-message-user" : "chat-message-ai"}`}
      >
        {isUser ? (
          <div className="chat-message-text">{text}</div>
        ) : (
          <ReactMarkdown className="chat-markdown" skipHtml>
            {text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
