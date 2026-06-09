import { memo } from 'react';
import '../styles/components/ThemeToggle.css';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <button
      className="theme-toggle theme-toggle-hero"
      id="themeToggle"
      type="button"
      aria-label={theme === 'dark' ? t('theme.toggle.light') : t('theme.toggle.dark')}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
      <span className="theme-toggle__text">{theme === 'dark' ? t('theme.dark') : t('theme.light')}</span>
    </button>
  );
});
