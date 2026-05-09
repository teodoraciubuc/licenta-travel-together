import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import "../styles/ChatBot.css";

const INITIAL_MESSAGE = {
  id: "assistant-welcome",
  sender: "assistant",
  text: "Hi! I can help with general travel planning and questions about using Travel Together.",
};

const HIDDEN_ROUTES = new Set(["/login", "/register"]);

export default function ChatBot() {
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem("token");

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const shouldHide = HIDDEN_ROUTES.has(location.pathname) || !token;

  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    setIsOpen(false);
    setIsLoading(false);
  }, [token, location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: trimmedInput,
      });

      const replyText =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "I can help with travel planning questions and guidance about using Travel Together.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: replyText,
        },
      ]);
    } catch (requestError) {
      console.error("Chat request failed:", requestError);
      setError("The assistant is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (shouldHide) {
    return null;
  }

  return (
    <div className="chatbot">
      {isOpen ? (
        <section className="chatbot__panel" aria-label="Travel Together assistant">
          <div className="chatbot__header">
            <div>
              <strong>Travel Assistant</strong>
              <p>Travel planning and app help</p>
            </div>

            <button
              type="button"
              className="chatbot__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className="chatbot__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot__message chatbot__message--${message.sender}`}
              >
                {message.text}
              </div>
            ))}

            {isLoading ? (
              <div className="chatbot__message chatbot__message--assistant chatbot__message--loading">
                Thinking...
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot__form" onSubmit={handleSubmit}>
            <textarea
              className="chatbot__input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about trips or how to use the app..."
              rows={2}
              disabled={isLoading}
            />

            <button
              type="submit"
              className="chatbot__send"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>

          {error ? <p className="chatbot__error">{error}</p> : null}
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot__toggle"
        onClick={() => setIsOpen((currentState) => !currentState)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        Chat
      </button>
    </div>
  );
}