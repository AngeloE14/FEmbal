/**
 * Página principal.
 * Mantiene la estructura visual de página única del proyecto original.
 */

import { lazy, Suspense, useCallback, useState } from 'react';
import { FileBadge2 } from 'lucide-react';
import { Calculator } from '../components/Calculator';
import '../components/EmbalmingCertificateModule/EmbalmingCertificateModule.css';
import { ThemeToggle } from '../components/ThemeToggle';

const LazyAudioPlayer = lazy(async () => {
  const module = await import('../components/AudioPlayer');
  return { default: module.AudioPlayer };
});

const LazyCertificateModule = lazy(async () => {
  const module = await import('../components/EmbalmingCertificateModule');
  return { default: module.EmbalmingCertificateModule };
});

export function HomePage() {
  const [isCertificateModeOpen, setIsCertificateModeOpen] = useState(false);

  const preloadCertificateModule = useCallback(() => {
    import('../components/EmbalmingCertificateModule');
  }, []);

  const openCertificateMode = useCallback(() => {
    setIsCertificateModeOpen(true);
  }, []);

  const closeCertificateMode = useCallback(() => {
    setIsCertificateModeOpen(false);
  }, []);

  return (
    <>
      <div className="fondo-ambiental" aria-hidden="true"></div>
      <ThemeToggle />
      <button
        aria-checked={isCertificateModeOpen}
        className="certificate-mode-toggle"
        role="switch"
        type="button"
        onClick={openCertificateMode}
        onPointerEnter={preloadCertificateModule}
        onTouchStart={preloadCertificateModule}
      >
        <span className="certificate-mode-toggle__icon" aria-hidden="true">
          <FileBadge2 size={18} strokeWidth={2.2} />
        </span>
        <span className="certificate-mode-toggle__label">Modo Certificado</span>
      </button>
      <main className="panel">
        <Calculator />
      </main>
      <Suspense fallback={null}>
        <LazyCertificateModule
          isOpen={isCertificateModeOpen}
          onClose={closeCertificateMode}
        />
      </Suspense>
      {/* El audio no es crítico para el primer render; se carga en diferido. */}
      <Suspense fallback={null}>
        <LazyAudioPlayer />
      </Suspense>
    </>
  );
}
