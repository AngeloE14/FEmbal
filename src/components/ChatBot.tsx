import { memo, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import '../styles/components/ChatBot.css';
import { useChatBot } from '../hooks/useChatBot';
import { ChatMessage } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';

export const ChatBot = memo(function ChatBot() {
  const { messages, isTyping, sendMessage, resetChat } = useChatBot();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const hasUserMessage = messages.some((m) => m.role === 'user');
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    latestMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, isTyping, messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((currentValue) => !currentValue);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = inputValue.trim();

    if (!message || isTyping) {
      return;
    }

    sendMessage(message);
    setInputValue('');
  };

  return (
    <aside className="chatbot" aria-label="Asistente Mictlan">
      {isOpen && (
        <section
          className="chatbot__panel"
          id="mictlan-chatbot-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="mictlan-chatbot-title"
          aria-describedby="mictlan-chatbot-scope"
        >
          <header className="chatbot__header">
            <div className="chatbot__brand">
              <img
                className="chatbot__brand-mark"
                src="/assets/images/mictlan-bot.png"
                alt=""
                aria-hidden="true"
              />
              <div className="chatbot__brand-copy">
                <h2 id="mictlan-chatbot-title">Mictlan</h2>
                <p>Asistente virtual</p>
              </div>
            </div>
            <div className="chatbot__actions">
              <button
                className="chatbot__icon-button"
                type="button"
                aria-label="Reiniciar conversacion"
                onClick={resetChat}
              >
                <span aria-hidden="true">↺</span>
              </button>
              <button
                className="chatbot__icon-button"
                type="button"
                aria-label="Cerrar asistente"
                onClick={handleToggle}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <p className="chatbot__scope" id="mictlan-chatbot-scope">
            Asistente virtual sobre mezclas arteriales, índice, preservación, conversiones, aditivos, casos especiales, seguridad y certificados. Puede cometer errores.
          </p>

          <div className="chatbot__messages" aria-live="polite">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {!hasUserMessage && (
              <SuggestedQuestions onSelect={sendMessage} />
            )}

            {isTyping && (
              <div className="chatbot__typing" role="status" aria-label="Mictlan esta escribiendo">
                <img
                  className="chatbot__typing-avatar"
                  src="/assets/images/mictlan-bot.png"
                  alt=""
                  aria-hidden="true"
                />
                <span className="chatbot__typing-bubble" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}

            <div ref={latestMessageRef} />
          </div>

          <form className="chatbot__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="chatbot__input"
              type="text"
              value={inputValue}
              placeholder="Pregunta a Mictlan"
              aria-label="Mensaje para Mictlan"
              autoComplete="off"
              maxLength={240}
              onChange={handleInputChange}
            />
            <button
              className="chatbot__send"
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!inputValue.trim() || isTyping}
            >
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      )}

      <button
        className={`chatbot__fab${isOpen ? ' chatbot__fab--open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={isOpen}
        aria-controls="mictlan-chatbot-panel"
        onClick={handleToggle}
      >
        <img
          className="chatbot__fab-mark"
          src="/assets/images/logo-circular.png"
          alt=""
          aria-hidden="true"
        />
      </button>
    </aside>
  );
});
