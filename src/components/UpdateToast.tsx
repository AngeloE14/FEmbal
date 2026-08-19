import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export function UpdateToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const checkForUpdate = async () => {
      try {
        const res = await fetch('./manifest.json', { cache: 'no-store' });
        const manifest = await res.json();
        const remoteVersion = manifest.version;
        if (!remoteVersion) return;

        const localVersion = localStorage.getItem('esams-version');
        if (localVersion && localVersion !== remoteVersion) {
          setShow(true);
        }
        localStorage.setItem('esams-version', remoteVersion);
      } catch {
        // silencioso
      }
    };

    checkForUpdate();
    timeout = setInterval(checkForUpdate, CHECK_INTERVAL);

    return () => clearInterval(timeout);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <div className="update-toast__content">
        <span className="update-toast__icon" aria-hidden="true">
          <RefreshCw size={16} />
        </span>
        <div className="update-toast__text">
          <strong>Nueva versión disponible</strong>
          <span>Recarga para actualizar</span>
        </div>
        <button
          className="update-toast__btn"
          onClick={handleUpdate}
          type="button"
        >
          Actualizar
        </button>
        <button
          className="update-toast__close"
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
