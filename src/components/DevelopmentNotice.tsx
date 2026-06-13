import { memo } from 'react';
import '../styles/components/DevelopmentNotice.css';
import { useI18n } from '../hooks/useI18n';

export const DevelopmentNotice = memo(function DevelopmentNotice() {
  const { t } = useI18n();

  return (
    <section className="development-notice" aria-label={t('development.notice.label')}>
      <span className="development-notice__mark" aria-hidden="true">
        i
      </span>
      <p>
        <strong>{t('development.notice.label')}</strong>
        <span>{t('development.notice.text')}</span>
      </p>
    </section>
  );
});
