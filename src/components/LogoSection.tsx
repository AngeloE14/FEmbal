import { memo } from 'react';
import '../styles/components/LogoSection.css';
import { useI18n } from '../hooks/useI18n';

export const LogoSection = memo(function LogoSection() {
  const { t } = useI18n();
  const logoSrc = 'assets/images/logo-circular.png';

  return (
    <section className="logo-head">
      <div className="logo-season logo-season--summer">
        <div className="summer-sparkles" aria-hidden="true">
          <span className="summer-sparkle summer-sparkle--1"></span>
          <span className="summer-sparkle summer-sparkle--2"></span>
          <span className="summer-sparkle summer-sparkle--3"></span>
          <span className="summer-sparkle summer-sparkle--4"></span>
          <span className="summer-sparkle summer-sparkle--5"></span>
          <span className="summer-sparkle summer-sparkle--6"></span>
        </div>
        <img
          src={logoSrc}
          alt={t('logo.alt')}
          width={220}
          height={220}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </section>
  );
});
