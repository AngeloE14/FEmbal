/**
 * Componente de mensaje individual del chat.
 *
 * Mejoras:
 * - Renderizado de markdown ligero (negritas, itálicas, listas, código, enlaces).
 * - Botones de feedback (útil / no útil) en mensajes del bot.
 * - Identificador visible para enlazar feedback con el mensaje.
 */

import { memo, useCallback, useMemo } from 'react';
import type { ChatMessage as ChatMessageModel } from '../types/chat';
import type { FeedbackEntry } from '../hooks/useChatBot';
import { assetUrl } from '../utils/paths';

interface ChatMessageProps {
  readonly message: ChatMessageModel;
  readonly feedback?: readonly FeedbackEntry[];
  readonly onFeedback?: (messageId: string, useful: boolean) => void;
}

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
});

// ──────────────────────────────────────────────
// Renderizador de markdown ligero (sin dependencias)
// ──────────────────────────────────────────────

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // *italic*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    // Encontrar la coincidencia más cercana al inicio.
    const matches: { index: number; match: string; render: React.ReactNode }[] = [];

    if (boldMatch) {
      matches.push({
        index: boldMatch.index!,
        match: boldMatch[0],
        render: <strong key={key++}>{boldMatch[1]}</strong>,
      });
    }
    if (italicMatch) {
      matches.push({
        index: italicMatch.index!,
        match: italicMatch[0],
        render: <em key={key++}>{italicMatch[1]}</em>,
      });
    }
    if (codeMatch) {
      matches.push({
        index: codeMatch.index!,
        match: codeMatch[0],
        render: <code key={key++}>{codeMatch[1]}</code>,
      });
    }
    if (linkMatch) {
      matches.push({
        index: linkMatch.index!,
        match: linkMatch[0],
        render: (
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        ),
      });
    }

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Tomar la coincidencia más temprana.
    const earliest = matches.reduce((a, b) => (a.index < b.index ? a : b));

    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }

    parts.push(earliest.render);
    remaining = remaining.slice(earliest.index + earliest.match.length);
  }

  return parts.length === 1 ? parts[0] : parts;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let inList = false;

  for (const line of lines) {
    const listMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    const numberedListMatch = line.match(/^(\s*)\d+\.\s+(.+)/);

    if (listMatch) {
      // Lista no ordenada.
      if (!inList) {
        nodes.push(<ul key={key++} className="chat-message__list">{''}</ul>);
        inList = true;
      }
      const lastUl = nodes[nodes.length - 1] as React.ReactElement;
      nodes[nodes.length - 1] = (
        <ul key={lastUl.key} className="chat-message__list">
          {(lastUl.props as { children?: React.ReactNode }).children}
          <li>{renderInlineMarkdown(listMatch[2])}</li>
        </ul>
      );
    } else if (numberedListMatch) {
      if (!inList) {
        nodes.push(<ol key={key++} className="chat-message__list">{''}</ol>);
        inList = true;
      }
      const lastOl = nodes[nodes.length - 1] as React.ReactElement;
      nodes[nodes.length - 1] = (
        <ol key={lastOl.key} className="chat-message__list">
          {(lastOl.props as { children?: React.ReactNode }).children}
          <li>{renderInlineMarkdown(numberedListMatch[2])}</li>
        </ol>
      );
    } else {
      inList = false;
      if (line === '') {
        nodes.push(<br key={key++} />);
      } else if (line.startsWith('### ')) {
        nodes.push(<h3 key={key++} className="chat-message__heading">{renderInlineMarkdown(line.slice(4))}</h3>);
      } else {
        nodes.push(
          <p key={key++} className="chat-message__paragraph">
            {renderInlineMarkdown(line)}
          </p>,
        );
      }
    }
  }

  return nodes;
}

// ──────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────

export const ChatMessage = memo(function ChatMessage({ message, feedback: feedbackList, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const createdAt = new Date(message.createdAt);
  const timeLabel = Number.isNaN(createdAt.getTime()) ? '' : timeFormatter.format(createdAt);

  // Determinar feedback actual para este mensaje.
  const currentFeedback = useMemo(() => {
    if (!feedbackList) return null;
    return feedbackList.find((f) => f.messageId === message.id) ?? null;
  }, [feedbackList, message.id]);

  const handleUseful = useCallback(() => {
    onFeedback?.(message.id, true);
  }, [onFeedback, message.id]);

  const handleNotUseful = useCallback(() => {
    onFeedback?.(message.id, false);
  }, [onFeedback, message.id]);

  return (
    <article
      className={`chat-message chat-message--${message.role}`}
      aria-label={isUser ? 'Mensaje del usuario' : 'Mensaje del asistente'}
    >
      {isUser ? (
        <span className="chat-message__avatar chat-message__avatar--user" aria-hidden="true">
          👤
        </span>
      ) : (
        <img
          className="chat-message__avatar chat-message__avatar--bot"
          src={assetUrl('/assets/images/mictlan-bot.png')}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="chat-message__body">
        <div className="chat-message__meta">
          <span>{isUser ? 'Tú' : 'Mictlan'}</span>
          {timeLabel && <time dateTime={message.createdAt}>{timeLabel}</time>}
        </div>
        <div className={`chat-message__bubble ${isUser ? '' : 'chat-message__bubble--bot'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        {/* Botones de feedback solo en mensajes del bot. */}
        {!isUser && onFeedback && (
          <div className="chat-message__feedback">
            <span className="chat-message__feedback-label">¿Te fue útil?</span>
            <button
              type="button"
              className={`chat-message__feedback-btn ${currentFeedback?.value === true ? 'chat-message__feedback-btn--active' : ''}`}
              onClick={handleUseful}
              aria-label="Útil"
              title="Útil"
            >
              👍
            </button>
            <button
              type="button"
              className={`chat-message__feedback-btn ${currentFeedback?.value === false ? 'chat-message__feedback-btn--active' : ''}`}
              onClick={handleNotUseful}
              aria-label="No útil"
              title="No útil"
            >
              👎
            </button>
          </div>
        )}
      </div>
    </article>
  );
});
