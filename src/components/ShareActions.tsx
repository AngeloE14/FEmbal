import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/paths';
import { useI18n } from '../hooks/useI18n';
import '../styles/components/ShareActions.css';

interface ShareActionsProps {
  shareFeedback: string;
  hasResult: boolean;
  onShare: () => void;
  onShareAsImage: () => Promise<void>;
}

export const ShareActions = memo(function ShareActions({ shareFeedback, hasResult, onShare, onShareAsImage }: ShareActionsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = useCallback(() => {
    if (!hasResult) return;
    setIsOpen((v) => !v);
  }, [hasResult]);

  const handleSelect = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
      } finally {
        setIsOpen(false);
      }
    },
    [],
  );

  const handleCopyLink = useCallback(async () => {
    setIsOpen(false);
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className="share-actions" ref={rootRef}>
      <div className="share-wrapper">
        <button
          className="share-button boton-principal"
          id="shareResultButton"
          type="button"
          disabled={!hasResult}
          onClick={handleToggle}
        >
          {t('share.button')}
        </button>

        {isOpen && (
          <div className="share-menu" role="menu">
            <button
              className="share-menu__item"
              type="button"
              role="menuitem"
              onClick={onShare}
            >
              {t('share.result')}
            </button>
            <button
              className="share-menu__item"
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onShareAsImage)}
            >
              {t('share.image.download')}
            </button>
            <button
              className="share-menu__item"
              type="button"
              role="menuitem"
              onClick={handleCopyLink}
            >
              {t('share.link')}
            </button>
          </div>
        )}
      </div>

      {linkCopied && (
        <p className="share-feedback share-feedback--link" role="status" aria-live="polite">
          <span>✓ {t('share.copied')}</span>
        </p>
      )}

      <p
        className="share-feedback"
        id="shareFeedback"
        role="status"
        aria-live="polite"
        style={{ display: shareFeedback && !linkCopied ? 'flex' : 'none' }}
      >
        <img src={assetUrl('/assets/images/logo-circular.png')} alt="Logo ESAMS" width={24} height={24} loading="lazy" decoding="async" />
        <span id="shareFeedbackText">{shareFeedback}</span>
      </p>
    </div>
  );
});
