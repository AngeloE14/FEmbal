/**
 * Encabezado de la app.
 * Agrupa logo y bloque hero para mantener composición semántica.
 */

import { memo } from 'react';
import { HeroSection } from './HeroSection';
import { LogoSection } from './LogoSection';
import '../styles/components/Header.css';

export const Header = memo(function Header() {
  return (
    <div className="header-cover">
      <LogoSection />
      <HeroSection />
    </div>
  );
});
