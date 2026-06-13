import { memo, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import '../styles/components/ChatBot.css';
import { useChatBot } from '../hooks/useChatBot';
import { ChatMessage } from './ChatMessage';

export const ChatBot = memo(function ChatBot() {
  const { messages, isTyping, sendMessage, resetChat } = useChatBot();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
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
    <aside className="chatbot" aria-label="Mictlan AI">
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
              <span className="chatbot__brand-mark" aria-hidden="true">
                M
              </span>
              <div className="chatbot__brand-copy">
                <h2 id="mictlan-chatbot-title">Mictlan AI</h2>
                <p>Dominio local</p>
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
                aria-label="Cerrar Mictlan AI"
                onClick={handleToggle}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <p className="chatbot__scope" id="mictlan-chatbot-scope">
            Apoyo local sobre calculadora, mezclas y certificado. No guarda historial ni datos del chat; al
            reiniciar borra la conversacion visible. Puede cometer errores y solo cubre este dominio.
          </p>

          <div className="chatbot__messages" aria-live="polite">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping && (
              <div className="chatbot__typing" role="status" aria-label="Mictlan AI esta escribiendo">
                <span className="chatbot__typing-avatar" aria-hidden="true">
                  M
                </span>
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
              placeholder="Pregunta a Mictlan AI"
              aria-label="Mensaje para Mictlan AI"
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
        aria-label={isOpen ? 'Cerrar Mictlan AI' : 'Abrir Mictlan AI'}
        aria-expanded={isOpen}
        aria-controls="mictlan-chatbot-panel"
        onClick={handleToggle}
      >
        <span className="chatbot__fab-mark" aria-hidden="true">
          {isOpen ? '×' : 'M'}
        </span>
      </button>
    </aside>
  );
});
