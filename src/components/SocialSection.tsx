import { memo } from 'react';
import { assetUrl } from '../utils/paths';
import { useI18n } from '../hooks/useI18n';
import '../styles/components/SocialSection.css';

/**
 * Sección de redes sociales.
 * Mantiene la intención original de contacto, pero con markup accesible.
 */

export const SocialSection = memo(function SocialSection() {
  const { t } = useI18n();
  return (
    <section className="redes-sociales" aria-label={t('social.title')}>
      <h2 className="redes-sociales__titulo">{t('social.title')}</h2>

      <nav className="redes-sociales__lista" aria-label="Enlaces de redes sociales">
        <a
          className="redes-sociales__enlace redes-sociales__enlace--instagram"
          href="https://www.instagram.com/esc.artes.mortuorias?igsh=ZXRoMTN4NDRqeHA0"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('social.instagram.aria')}
        >
          <span className="redes-sociales__icono" aria-hidden="true">
            <img src={assetUrl('/assets/images/instagram.png')} alt="" width={26} height={26} loading="lazy" decoding="async" fetchPriority="low" />
          </span>
          <span className="redes-sociales__texto">
            <span className="redes-sociales__nombre">{t('social.instagram')}</span>
            <span className="redes-sociales__meta">{t('social.instagram.handle')}</span>
          </span>
          <span className="redes-sociales__cta" aria-hidden="true">
            ↗
          </span>
        </a>

        <a
          className="redes-sociales__enlace redes-sociales__enlace--tiktok"
          href="https://vm.tiktok.com/ZS9F2fxBqsaBR-Cqay8/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('social.tiktok.aria')}
        >
          <span className="redes-sociales__icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width={24} height={24} focusable="false">
              <path d="M13.6 4.1v10.3a2.54 2.54 0 1 1-2.55-2.54c.2 0 .39.03.58.07V9.3a5.38 5.38 0 0 0-.58-.03 5.2 5.2 0 1 0 5.2 5.2V9.21a6.68 6.68 0 0 0 3.93 1.27V7.94a4.22 4.22 0 0 1-1.17-.16 4.12 4.12 0 0 1-2.41-1.89 4.13 4.13 0 0 1-.55-1.79h-2.45Z" />
            </svg>
          </span>
          <span className="redes-sociales__texto">
            <span className="redes-sociales__nombre">{t('social.tiktok')}</span>
            <span className="redes-sociales__meta">{t('social.tiktok.desc')}</span>
          </span>
          <span className="redes-sociales__cta" aria-hidden="true">
            ↗
          </span>
        </a>

        <a
          className="redes-sociales__enlace redes-sociales__enlace--correo"
          href="mailto:informes.esams@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('social.email.aria')}
        >
          <span className="redes-sociales__icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" width={24} height={24} focusable="false">
              <path d="M3.75 5.25h16.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Zm.93 2.1 7.32 5.34 7.32-5.34H4.68Zm15.57 9.15V8.92l-7.81 5.69a.75.75 0 0 1-.88 0L3.75 8.92v7.58h16.5Z" />
            </svg>
          </span>
          <span className="redes-sociales__texto">
            <span className="redes-sociales__nombre">{t('social.email')}</span>
            <span className="redes-sociales__meta">{t('social.email.address')}</span>
          </span>
          <span className="redes-sociales__cta" aria-hidden="true">
            ↗
          </span>
        </a>
      </nav>
    </section>
  );
});
