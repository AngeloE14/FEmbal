import { memo } from 'react';
import type { ChatMessage as ChatMessageModel } from '../types/chat';
import { assetUrl } from '../utils/paths';

interface ChatMessageProps {
  readonly message: ChatMessageModel;
}

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
});

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const createdAt = new Date(message.createdAt);
  const timeLabel = Number.isNaN(createdAt.getTime()) ? '' : timeFormatter.format(createdAt);

  return (
    <article
      className={`chat-message chat-message--${message.role}`}
      aria-label={isUser ? 'Mensaje del usuario' : 'Mensaje de Mictlan'}
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
        <p className="chat-message__bubble">{message.content}</p>
      </div>
    </article>
  );
});
