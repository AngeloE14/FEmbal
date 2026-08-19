import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('esams-install-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('esams-install-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="install-banner" role="status" aria-live="polite">
      <div className="install-banner__content">
        <span className="install-banner__icon" aria-hidden="true">
          <Download size={18} />
        </span>
        <div className="install-banner__text">
          <strong>Instalar ESAMS</strong>
          <span>Agrega la app a tu pantalla de inicio</span>
          <span className="install-banner__hint">Te avisaremos cuando haya funciones nuevas</span>
        </div>
        <button
          className="install-banner__btn"
          onClick={handleInstall}
          disabled={isInstalling}
          type="button"
        >
          {isInstalling ? 'Instalando...' : 'Instalar'}
        </button>
        <button
          className="install-banner__close"
          onClick={handleDismiss}
          aria-label="Cerrar"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
