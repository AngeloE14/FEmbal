/**
 * Chatbot con IA (Google Gemini).
 * La conversación se envía al endpoint /api/chat (Serverless Function),
 * que consulta a Gemini en el servidor manteniendo la API key privada.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import '../styles/components/ChatBot.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  text: '¡Hola! 👋 Soy el asistente de la Calculadora de Solución Arterial de ESAMS. Pregúntame sobre el uso de la calculadora, diluciones, químicos arteriales o tanatopraxia.\n\nImportante: soy una IA y puedo cometer errores; mi información es orientativa y no sustituye la asesoría de un profesional.',
};

const FALLBACK_ERRORS: Record<string, string> = {
  rate_limited: 'Demasiadas preguntas seguidas. Espera un momento antes de volver a intentar.',
  upstream: 'Hubo un problema al consultar al asistente. Intenta nuevamente en unos segundos.',
  default: 'No pude obtener respuesta. Revisa tu conexión e intenta de nuevo.',
};

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChatBot({ isOpen, onToggle }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, errorMsg]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const history = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: m.text,
    }));

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      let data: { reply?: unknown; error?: string; message?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        /* respuesta sin JSON válido */
      }

      if (res.ok && typeof data.reply === 'string' && data.reply.length > 0) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply as string }]);
      } else {
        setErrorMsg(
          data.message ?? FALLBACK_ERRORS[data.error ?? ''] ?? FALLBACK_ERRORS.default,
        );
      }
    } catch {
      setErrorMsg(FALLBACK_ERRORS.default);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <section
      className={`chatbot-panel${isOpen ? ' chatbot-panel--open' : ''}`}
      aria-label="Asistente virtual"
      aria-hidden={!isOpen}
    >
      <header className="chatbot-panel__header">
        <div className="chatbot-panel__title">
          <span className="chatbot-panel__avatar" aria-hidden="true">🤖</span>
          <div>
            <strong>Asistente ESAMS</strong>
            <span className="chatbot-panel__status">Gemini 3.5 Flash Lite</span>
          </div>
        </div>
        <button
          className="chatbot-panel__close"
          type="button"
          onClick={onToggle}
          aria-label="Cerrar chat"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </header>

      <div className="chatbot-panel__messages" ref={listRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chatbot-msg chatbot-msg--${msg.role}`}>
            {msg.role === 'assistant' && (
              <span className="chatbot-msg__avatar" aria-hidden="true">🤖</span>
            )}
            <p className="chatbot-msg__bubble">{msg.text}</p>
          </div>
        ))}
        {isSending && (
          <div className="chatbot-msg chatbot-msg--assistant">
            <span className="chatbot-msg__avatar" aria-hidden="true">🤖</span>
            <p className="chatbot-msg__bubble chatbot-typing" aria-label="El asistente está escribiendo">
              <span /><span /><span />
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="chatbot-panel__error" role="alert">{errorMsg}</p>
      )}

      <form className="chatbot-panel__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chatbot-panel__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          maxLength={1000}
          autoComplete="off"
          disabled={isSending}
          aria-label="Mensaje para el asistente"
        />
        <button
          className="chatbot-panel__send"
          type="submit"
          disabled={isSending || input.trim().length === 0}
          aria-label="Enviar mensaje"
        >
          <Send size={16} strokeWidth={2.2} />
        </button>
      </form>
      <p className="chatbot-panel__note">
        Respuestas generadas por IA. Pueden ser imprecisas; verifica la información importante.
      </p>
    </section>
  );
}

export default ChatBot;
