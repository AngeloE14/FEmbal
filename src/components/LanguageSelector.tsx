import { memo, useCallback, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import type { Locale } from '../utils/i18n';
import '../styles/components/LanguageSelector.css';

const FLAGS: Record<Locale, string> = {
  'es-MX': '🇲🇽',
  en: '🇺🇸',
  it: '🇮🇹',
};

const OPTIONS: { value: Locale; labelKey: string }[] = [
  { value: 'es-MX', labelKey: 'locale.es-MX' },
  { value: 'en', labelKey: 'locale.en' },
  { value: 'it', labelKey: 'locale.it' },
];

export const LanguageSelector = memo(function LanguageSelector({ onClose }: { onClose?: () => void }) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = useCallback(() => setIsOpen((v) => !v), []);

  const handleSelect = useCallback(
    (value: Locale) => {
      setLocale(value);
      setIsOpen(false);
      onClose?.();
    },
    [setLocale, onClose],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!rootRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
      onClose?.();
    }
  }, [onClose]);

  return (
    <div className="language-selector" ref={rootRef} onPointerDown={handlePointerDown}>
      <button
        className="language-selector__toggle"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('locale.label')}
        onClick={handleToggle}
      >
        <span className="language-selector__flag">{FLAGS[locale]}</span>
      </button>
      {isOpen && (
        <div className="language-selector__menu" role="listbox" aria-label={t('locale.label')}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`language-selector__option${locale === opt.value ? ' language-selector__option--active' : ''}`}
              type="button"
              role="option"
              aria-selected={locale === opt.value}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="language-selector__option-flag">{FLAGS[opt.value]}</span>
              <span>{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
