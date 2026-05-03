import React, { useState, useRef, useEffect } from "react";
import api, { getApiData, getApiErrorMessage } from "../services/api";
import Header from "../components/Header";
import ChatMessage from "../components/ChatMessage";
import "./Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat", { message: userMessage.text });
      const data = getApiData(response.data);
      console.log("Chat API response data:", data);

      let aiText = "";
      if (typeof data?.reply === "string") aiText = data.reply.trim();
      if (!aiText && typeof data?.message === "string")
        aiText = data.message.trim();
      if (!aiText) aiText = "No response from the chat service.";

      setMessages((prev) => [...prev, { text: aiText, sender: "ai" }]);
    } catch (error) {
      console.error("Error calling chat API:", error);
      const errorMessage = getApiErrorMessage(
        error,
        "Sorry, something went wrong. Please try again.",
      );
      setMessages((prev) => [...prev, { text: errorMessage, sender: "ai" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  return (
    <div className="chatbot-page">
      <Header />
      <div className="chatbot-header">
        <h1>AI Chatbot</h1>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <ChatMessage key={`${msg.sender}-${index}`} message={msg} />
        ))}
        {loading && (
          <div
            className="chat-message-row chat-message-row-ai"
            aria-live="polite"
          >
            <div className="chat-message-bubble chat-message-ai">
              <div className="chat-typing">
                <span>Typing</span>
                <span className="chat-typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="chatbot-input"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="chatbot-send-button"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
