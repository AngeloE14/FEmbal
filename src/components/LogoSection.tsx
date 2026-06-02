import { memo } from 'react';
import '../styles/components/LogoSection.css';

/**
 * Bloque visual del logotipo.
 * Se mantiene casi idéntico al original para preservar identidad de marca.
 */

export const LogoSection = memo(function LogoSection() {
  const logoSrc = 'assets/images/logo-circular.png';

  return (
    <section className="logo-head" aria-label="Logo institucional">
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
          alt="Logo Escuela de Artes Mortuorias del Sureste"
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
