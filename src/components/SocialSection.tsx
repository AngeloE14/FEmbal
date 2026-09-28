/**
 * Sección de redes sociales del pie de página.
 *
 * Los iconos son WebP blancos sobre transparencia (assets/images/*_icon.webp),
 * así que se usan como glifos monocromos: el CSS invierte su color según el
 * tema en vez de montar una baldosa de color detrás. No hay texto: cada
 * enlace se identifica por su icono y por su `aria-label`.
 *
 * Los cuatro .webp no traen el mismo margen — el glifo de Instagram y TikTok
 * toca los bordes del lienzo de 128px, el de YouTube y el del sobre vienen
 * centrados — así que `--icon-scale` (ver SocialSection.css) iguala el tamaño
 * óptico de los cuatro.
 */

import { memo } from 'react';
import { useI18n } from '../hooks/useI18n';
import { assetUrl } from '../utils/paths';
import '../styles/components/SocialSection.css';

interface SocialLink {
  id: string;
  icon: string;
  href: string;
  /** `mailto:` no debe abrir pestaña nueva. */
  openInNewTab: boolean;
  ariaKey: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    icon: 'assets/images/instagram_icon.webp',
    href: 'https://www.instagram.com/esc.artes.mortuorias?igsh=ZXRoMTN4NDRqeHA0',
    openInNewTab: true,
    ariaKey: 'social.instagram.aria',
  },
  {
    id: 'tiktok',
    icon: 'assets/images/tiktok_icon.webp',
    href: 'https://vm.tiktok.com/ZS9F2fxBqsaBR-Cqay8/',
    openInNewTab: true,
    ariaKey: 'social.tiktok.aria',
  },
  {
    id: 'youtube',
    icon: 'assets/images/youtube_icon.webp',
    href: 'https://www.youtube.com/@EscueladeartesMortuoriasdelsur',
    openInNewTab: true,
    ariaKey: 'social.youtube.aria',
  },
  {
    id: 'correo',
    icon: 'assets/images/email_icon.webp',
    href: 'mailto:informes.esams@gmail.com',
    openInNewTab: false,
    ariaKey: 'social.email.aria',
  },
];

export const SocialSection = memo(function SocialSection() {
  const { t } = useI18n();

  return (
    <section className="redes-sociales">
      <nav className="redes-sociales__lista" aria-label={t('social.title')}>
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            className={`redes-sociales__enlace redes-sociales__enlace--${link.id}`}
            href={link.href}
            {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
            aria-label={t(link.ariaKey)}
          >
            <span className="redes-sociales__icono" aria-hidden="true">
              <img src={assetUrl(link.icon)} alt="" width={128} height={128} loading="lazy" decoding="async" />
            </span>
          </a>
        ))}
      </nav>
    </section>
  );
});
