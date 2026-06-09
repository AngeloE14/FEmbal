/**
 * Página principal.
 * Mantiene la estructura visual de página única del proyecto original.
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { FileBadge2 } from 'lucide-react';
import { Calculator } from '../components/Calculator';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';
import { assetUrl } from '../utils/paths';

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
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  const openCertificateMode = useCallback(() => {
    setIsCertificateModeOpen(true);
  }, []);

  const closeCertificateMode = useCallback(() => {
    setIsCertificateModeOpen(false);
  }, []);

  const toggleTools = useCallback(() => {
    setIsToolsOpen((v) => !v);
  }, []);

  const closeTools = useCallback(() => {
    setIsToolsOpen(false);
  }, []);

  useEffect(() => {
    if (!isToolsOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!toolsRef.current?.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isToolsOpen]);

  return (
    <>
      <div className="floating-tools" ref={toolsRef}>
        <button
          className="floating-tools__toggle"
          type="button"
          aria-label="Más opciones"
          aria-expanded={isToolsOpen}
          onClick={toggleTools}
        >
          {isToolsOpen ? (
            '✕'
          ) : (
            <>
              <img
                className="floating-tools__logo"
                src={assetUrl('assets/images/logo-circular.png')}
                alt="ESAMS"
              />
              <span className="floating-tools__hand-box">
                <span className="floating-tools__hand" aria-hidden="true">👋</span>
              </span>
            </>
          )}
        </button>
        <span className="wc-badge" aria-hidden="true">
          <span className="wc-badge__icon wc-badge__icon--cup">🏆</span>
          <span className="wc-badge__icon wc-badge__icon--ball">⚽</span>
          <span className="wc-badge__year wc-badge__year--2">2</span>
          <span className="wc-badge__year wc-badge__year--0">0</span>
          <span className="wc-badge__year wc-badge__year--26">26</span>
        </span>
        {isToolsOpen && (
          <div className="floating-tools__items">
            <LanguageSelector onClose={closeTools} />
            <button
              className="certificate-mode-toggle"
              type="button"
              onClick={() => { closeTools(); openCertificateMode(); }}
            >
              <span className="certificate-mode-toggle__icon" aria-hidden="true">
                <FileBadge2 size={16} strokeWidth={2.2} />
              </span>
            </button>
            <button
              className="floating-tools__tutorial-btn"
              type="button"
              onClick={() => { closeTools(); setIsTutorialOpen(true); }}
              aria-label="Modo aprendizaje"
            >
              <span aria-hidden="true">🎓</span>
            </button>
            <ThemeToggle />
          </div>
        )}
      </div>
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
      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </>
  );
}
