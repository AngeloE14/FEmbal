import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import '../styles/components/ChatBot.css';
import { useChatBot } from '../hooks/useChatBot';
import { ChatMessage } from './ChatMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { assetUrl } from '../utils/paths';

interface ChatBotProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

export const ChatBot = memo(function ChatBot({ isOpen, onToggle }: ChatBotProps) {
  const {
    messages,
    isTyping,
    sendMessage,
    resetChat,
    feedback,
    sendFeedback,
    lastActions,
  } = useChatBot();

  const [inputValue, setInputValue] = useState('');
  const hasUserMessage = messages.some((m) => m.role === 'user');
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll suave al último mensaje.
    const scrollContainer = latestMessageRef.current?.closest('.chatbot__messages');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [isOpen, isTyping, messages]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  // Reiniciar input al cerrar el chat.
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const message = inputValue.trim();

      if (!message || isTyping) {
        return;
      }

      sendMessage(message);
      setInputValue('');
    },
    [inputValue, isTyping, sendMessage],
  );

  const handleAction = useCallback(
    (actionValue: string) => {
      sendMessage(actionValue);
    },
    [sendMessage],
  );

  return (
    <aside className={`chatbot${isOpen ? ' chatbot--open' : ''}`} aria-label="Asistente virtual">
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
                src={assetUrl('/assets/images/mictlan-bot.png')}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <div className="chatbot__brand-copy">
                <h2 id="mictlan-chatbot-title">Mictlan</h2>
                <p>Asistente técnico</p>
              </div>
            </div>
            <div className="chatbot__actions">
              <button
                className="chatbot__icon-button"
                type="button"
                aria-label="Reiniciar conversacion"
                title="Reiniciar conversación"
                onClick={resetChat}
              >
                <span aria-hidden="true">↺</span>
              </button>
              <button
                className="chatbot__icon-button"
                type="button"
                aria-label="Cerrar asistente"
                title="Cerrar asistente"
                onClick={onToggle}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          <p className="chatbot__scope" id="mictlan-chatbot-scope">
            Asistente técnico especializado en formulación arterial. Pregunta en lenguaje natural sobre mezclas, índices, aditivos, casos especiales y más.
          </p>

          <div className="chatbot__messages" aria-live="polite">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                feedback={feedback}
                onFeedback={sendFeedback}
              />
            ))}

            {!hasUserMessage && (
              <SuggestedQuestions onSelect={sendMessage} />
            )}

            {/* Acciones contextuales sugeridas para el último mensaje del bot. */}
            {hasUserMessage && lastActions.length > 0 && !isTyping && (
              <div className="chatbot__actions-contextual">
                {lastActions.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className="suggested-questions__chip chatbot__action-chip"
                    onClick={() => handleAction(action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="chatbot__typing" role="status" aria-label="El asistente esta escribiendo">
                <img
                  className="chatbot__typing-avatar"
                  src={assetUrl('/assets/images/mictlan-bot.png')}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
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
              placeholder="Escribe tu consulta técnica"
              aria-label="Mensaje para el asistente"
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
    </aside>
  );
});
