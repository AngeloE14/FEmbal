import { memo } from 'react';
import '../styles/components/LogoSection.css';
import { useI18n } from '../hooks/useI18n';

export const LogoSection = memo(function LogoSection() {
  const { t } = useI18n();
  const logoSrc = 'assets/images/logo-circular.webp';

  return (
    <section className="logo-head">
      <div className="logo-season logo-season--autumn">
        <div className="autumn-leaves" aria-hidden="true">
          <span className="autumn-leaf autumn-leaf--1"></span>
          <span className="autumn-leaf autumn-leaf--2"></span>
          <span className="autumn-leaf autumn-leaf--3"></span>
          <span className="autumn-leaf autumn-leaf--4"></span>
          <span className="autumn-leaf autumn-leaf--5"></span>
          <span className="autumn-leaf autumn-leaf--6"></span>
          <span className="autumn-leaf autumn-leaf--7"></span>
          <span className="autumn-leaf autumn-leaf--8"></span>
          <span className="autumn-leaf autumn-leaf--9"></span>
          <span className="autumn-leaf autumn-leaf--10"></span>
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
