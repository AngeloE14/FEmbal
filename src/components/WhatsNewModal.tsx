import { CHANGELOG } from '../config/changelog';
import { X } from 'lucide-react';

const STORAGE_KEY = 'esams-seen-changes';

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function getUnseenEntries() {
  const seen = getSeenIds();
  return CHANGELOG.filter((e) => !seen.has(e.id));
}

export function markAllSeen() {
  const seen = getSeenIds();
  CHANGELOG.forEach((e) => seen.add(e.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handleDone = () => {
    markAllSeen();
    onClose();
  };

  return (
    <div className="whatsnew-overlay" onClick={handleDone}>
      <div
        className="whatsnew-modal"
        role="dialog"
        aria-label="Novedades"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="whatsnew-modal__header">
          <h2>Novedades</h2>
          <button
            className="whatsnew-modal__close"
            onClick={handleDone}
            aria-label="Cerrar"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="whatsnew-modal__body">
          {CHANGELOG.map((entry) => (
            <div key={entry.id} className="whatsnew-modal__item">
              <span className="whatsnew-modal__icon" aria-hidden="true">
                {entry.icon}
              </span>
              <div className="whatsnew-modal__text">
                <strong>{entry.title}</strong>
                <span>{entry.description}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="whatsnew-modal__footer">
          <button
            className="whatsnew-modal__btn"
            onClick={handleDone}
            type="button"
          >
            Ya lo vi
          </button>
        </div>
      </div>
    </div>
  );
}
