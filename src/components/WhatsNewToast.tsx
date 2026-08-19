import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { WhatsNewModal, getUnseenEntries, markAllSeen } from './WhatsNewModal';

export function WhatsNewToast() {
  const [showToast, setShowToast] = useState(() => getUnseenEntries().length > 0);
  const [showModal, setShowModal] = useState(false);

  if (!showToast && !showModal) return null;

  const handleOpen = () => {
    setShowModal(true);
    setShowToast(false);
  };

  const handleClose = () => {
    markAllSeen();
    setShowModal(false);
    setShowToast(false);
  };

  const handleDismiss = () => {
    setShowToast(false);
  };

  return (
    <>
      {showToast && (
        <div className="whatsnew-toast" role="status" aria-live="polite">
          <div className="whatsnew-toast__content">
            <span className="whatsnew-toast__icon" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <div className="whatsnew-toast__text">
              <strong>Hay novedades</strong>
              <span>Descubre las nuevas funciones</span>
            </div>
            <button
              className="whatsnew-toast__btn"
              onClick={handleOpen}
              type="button"
            >
              Ver
            </button>
            <button
              className="whatsnew-toast__close"
              onClick={handleDismiss}
              aria-label="Cerrar"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <WhatsNewModal isOpen={showModal} onClose={handleClose} />
    </>
  );
}
