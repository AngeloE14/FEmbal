import { memo } from 'react';
import '../styles/components/LogoSection.css';
import { useI18n } from '../hooks/useI18n';

export const LogoSection = memo(function LogoSection() {
  const { t } = useI18n();
  const logoSrc = 'assets/images/logo-circular.webp';

  return (
    <section className="logo-head">
      <div className="logo-season logo-season--christmas">
        <div className="christmas-snow" aria-hidden="true">
          <span className="christmas-snowflake christmas-snowflake--1"></span>
          <span className="christmas-snowflake christmas-snowflake--2"></span>
          <span className="christmas-snowflake christmas-snowflake--3"></span>
          <span className="christmas-snowflake christmas-snowflake--4"></span>
          <span className="christmas-snowflake christmas-snowflake--5"></span>
          <span className="christmas-snowflake christmas-snowflake--6"></span>
          <span className="christmas-snowflake christmas-snowflake--7"></span>
          <span className="christmas-snowflake christmas-snowflake--8"></span>
          <span className="christmas-snowflake christmas-snowflake--9"></span>
          <span className="christmas-snowflake christmas-snowflake--10"></span>
          <span className="christmas-snowflake christmas-snowflake--11"></span>
          <span className="christmas-snowflake christmas-snowflake--12"></span>
          <span className="christmas-snowflake christmas-snowflake--13"></span>
          <span className="christmas-snowflake christmas-snowflake--14"></span>
          <span className="christmas-snowflake christmas-snowflake--15"></span>
          <span className="christmas-snowflake christmas-snowflake--16"></span>
        </div>
        <div className="christmas-snowbank" aria-hidden="true">
        </div>
        <span className="christmas-star" aria-hidden="true">✦</span>
        <div className="christmas-lights" aria-hidden="true">
          <span className="christmas-light christmas-light--1"></span>
          <span className="christmas-light christmas-light--2"></span>
          <span className="christmas-light christmas-light--3"></span>
          <span className="christmas-light christmas-light--4"></span>
          <span className="christmas-light christmas-light--5"></span>
          <span className="christmas-light christmas-light--6"></span>
          <span className="christmas-light christmas-light--7"></span>
          <span className="christmas-light christmas-light--8"></span>
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
