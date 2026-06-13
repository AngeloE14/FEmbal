import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalBotResponse } from '../utils/intentMatcher';
import type { ChatMessage, ChatRole } from '../types/chat';

const LEGACY_CHAT_STORAGE_KEY = 'mictlan-ai.messages';
const WELCOME_MESSAGE =
  'Soy Mictlantecuhtli, señor del Mictlán, guardián de los secretos del embalsamamiento. Mi conocimiento abarca mezclas arteriales, índice, preservación, aditivos y casos especiales. Pregunta, mortal, o elige una sugerencia.';

interface UseChatBotResult {
  readonly messages: readonly ChatMessage[];
  readonly isTyping: boolean;
  readonly sendMessage: (content: string) => void;
  readonly resetChat: () => void;
}

const createChatId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `mictlan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: createChatId(),
  role,
  content,
  createdAt: new Date().toISOString(),
});

const createInitialMessages = (): ChatMessage[] => [createMessage('bot', WELCOME_MESSAGE)];

const clearLegacyStoredMessages = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
  } catch {
    // localStorage puede no estar disponible en modo privado o entornos restringidos.
  }
};

export function useChatBot(): UseChatBotResult {
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const responseTimeoutRef = useRef<number | null>(null);

  const clearPendingResponse = useCallback(() => {
    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();

      if (!text || isTyping) {
        return;
      }

      const userMessage = createMessage('user', text);
      const responseDelay = Math.min(600, Math.max(150, text.length * 12));

      clearPendingResponse();
      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsTyping(true);

      responseTimeoutRef.current = window.setTimeout(() => {
        const botMessage = createMessage('bot', getLocalBotResponse(text));
        setMessages((currentMessages) => [...currentMessages, botMessage]);
        setIsTyping(false);
        responseTimeoutRef.current = null;
      }, responseDelay);
    },
    [clearPendingResponse, isTyping],
  );

  const resetChat = useCallback(() => {
    clearPendingResponse();
    clearLegacyStoredMessages();
    setIsTyping(false);
    setMessages(createInitialMessages());
  }, [clearPendingResponse]);

  useEffect(() => {
    clearLegacyStoredMessages();
  }, []);

  useEffect(() => clearPendingResponse, [clearPendingResponse]);

  return {
    messages,
    isTyping,
    sendMessage,
    resetChat,
  };
}
