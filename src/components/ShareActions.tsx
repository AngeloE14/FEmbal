import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/paths';
import { useI18n } from '../hooks/useI18n';
import '../styles/components/ShareActions.css';

interface ShareActionsProps {
  shareFeedback: string;
  hasResult: boolean;
  onShare: () => Promise<void>;
  onShareAsImage: () => Promise<void>;
}

export const ShareActions = memo(function ShareActions({ shareFeedback, hasResult, onShare, onShareAsImage }: ShareActionsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
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
              onClick={() => handleSelect(onShare)}
            >
              {t('share.button')}
            </button>
            <button
              className="share-menu__item"
              type="button"
              role="menuitem"
              onClick={() => handleSelect(onShareAsImage)}
            >
              {t('share.image.download')}
            </button>
          </div>
        )}
      </div>

      <p
        className="share-feedback"
        id="shareFeedback"
        role="status"
        aria-live="polite"
        style={{ display: shareFeedback ? 'flex' : 'none' }}
      >
        <img src={assetUrl('/assets/images/logo-circular.png')} alt="Logo ESAMS" width={24} height={24} loading="lazy" decoding="async" />
        <span id="shareFeedbackText">{shareFeedback}</span>
      </p>
    </div>
  );
});
