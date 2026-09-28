/**
 * Pie de página.
 * Envuelve la sección de redes y cierra con la línea legal, de modo que el
 * bloque se lea como un pie y no sólo como una lista de enlaces sueltos.
 */

import { memo } from 'react';
import { useI18n } from '../hooks/useI18n';
import { SocialSection } from './SocialSection';
import '../styles/components/Footer.css';

export const Footer = memo(function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <SocialSection />
      <p className="site-footer__legal">{t('footer.legal', year)}</p>
    </footer>
  );
});
