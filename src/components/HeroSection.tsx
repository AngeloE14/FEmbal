import { memo } from 'react';
import '../styles/components/HeroSection.css';
import '../styles/components/WorldCup2026.css';
import { useI18n } from '../hooks/useI18n';

/**
 * Bloque hero textual.
 * Conserva el mensaje principal del HTML original y su jerarquía semántica.
 */

export const HeroSection = memo(function HeroSection() {
  const { t } = useI18n();
  return (
    <section className="hero">
      <div className="hero-top">
        <h1 className="titulo-principal">{t('hero.title')}</h1>
      </div>
      <p>{t('hero.subtitle')}</p>
      <div className="hero-bars" aria-hidden="true">
        <span className="hero-bars__line hero-bars__line--green"></span>
        <span className="hero-bars__line hero-bars__line--white"></span>
        <span className="hero-bars__line hero-bars__line--red"></span>
      </div>
    </section>
  );
});
