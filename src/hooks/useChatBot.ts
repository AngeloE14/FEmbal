import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocalBotResponse, getActionsForMessage } from '../utils/intentMatcher';
import type { ChatMessage, ChatRole, KnowledgeAction } from '../types/chat';

const WELCOME_MESSAGE =
  'Soy Mictlan, asistente técnico especializado en formulación arterial. Mi conocimiento abarca mezclas arteriales, índice, preservación, aditivos, casos especiales y más. ¿En qué puedo ayudarte?';

export interface FeedbackEntry {
  readonly messageId: string;
  readonly value: boolean;
}

interface UseChatBotResult {
  readonly messages: readonly ChatMessage[];
  readonly isTyping: boolean;
  readonly sendMessage: (content: string) => void;
  readonly resetChat: () => void;
  readonly feedback: readonly FeedbackEntry[];
  readonly sendFeedback: (messageId: string, useful: boolean) => void;
  readonly lastActions: readonly KnowledgeAction[];
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

export function useChatBot(): UseChatBotResult {
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [lastActions, setLastActions] = useState<readonly KnowledgeAction[]>([]);
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

      // Reducimos el delay de escritura: más rápido que antes.
      const responseDelay = Math.min(250, Math.max(60, text.length * 4));

      clearPendingResponse();
      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsTyping(true);

      responseTimeoutRef.current = window.setTimeout(() => {
        const responseText = getLocalBotResponse(text);
        const botMessage = createMessage('bot', responseText);

        // Obtener acciones contextuales para este mensaje.
        const actions = getActionsForMessage(text) ?? [];
        setLastActions(actions);

        setMessages((currentMessages) => [...currentMessages, botMessage]);
        setIsTyping(false);
        responseTimeoutRef.current = null;
      }, responseDelay);
    },
    [clearPendingResponse, isTyping],
  );

  const resetChat = useCallback(() => {
    clearPendingResponse();
    setIsTyping(false);
    setMessages(createInitialMessages());
    setFeedback([]);
    setLastActions([]);
  }, [clearPendingResponse]);

  const sendFeedback = useCallback((messageId: string, useful: boolean) => {
    setFeedback((prev) => {
      const filtered = prev.filter((f) => f.messageId !== messageId);
      return [...filtered, { messageId, value: useful }];
    });
  }, []);

  useEffect(() => clearPendingResponse, [clearPendingResponse]);

  return {
    messages,
    isTyping,
    sendMessage,
    resetChat,
    feedback,
    sendFeedback,
    lastActions,
  };
}
