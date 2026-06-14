/**
 * Página principal.
 * Mantiene la estructura visual de página única del proyecto original.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileBadge2 } from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { EmbalmingCertificateModule } from '../components/EmbalmingCertificateModule';
import { Calculator } from '../components/Calculator';
import { ChatBot } from '../components/ChatBot';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';
import { assetUrl } from '../utils/paths';

export function HomePage() {
  const [isCertificateModeOpen, setIsCertificateModeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  const toggleChat = useCallback(() => {
    setIsChatOpen((v) => !v);
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
            <button
              className={`chatbot-toggle${isChatOpen ? ' chatbot-toggle--open' : ''}`}
              type="button"
              onClick={toggleChat}
              aria-label={isChatOpen ? 'Cerrar asistente' : 'Abrir asistente'}
              aria-expanded={isChatOpen}
            >
              <span className="chatbot-toggle__icon" aria-hidden="true">🤖</span>
            </button>
            <ThemeToggle />
          </div>
        )}
      </div>
      <main className="panel">
        <Calculator />
      </main>
      <EmbalmingCertificateModule
        isOpen={isCertificateModeOpen}
        onClose={closeCertificateMode}
      />
      <AudioPlayer />
      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <ChatBot isOpen={isChatOpen} onToggle={toggleChat} />
    </>
  );
}
