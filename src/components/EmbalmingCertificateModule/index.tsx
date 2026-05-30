import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CertificateForm } from './CertificateForm';
import { CertificatePreview } from './CertificatePreview';
import './EmbalmingCertificateModule.css';
import { PdfActions } from './PdfActions';
import { useCertificateData } from './hooks/useCertificateData';
import { useCertificateSync } from './hooks/useCertificateSync';

const EmbalmingCertificateModule = memo(function EmbalmingCertificateModule({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { certificateData: manualCertificateData, resetCertificate, updateField } = useCertificateData();
  const certificateData = useCertificateSync(manualCertificateData);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);

  useEffect(() => {
    setIsDataConfirmed(false);
  }, [certificateData]);

  useEffect(() => {
    if (!isOpen) return;
    const formPanel = document.querySelector<HTMLElement>('.certificate-module__form-panel');
    if (!formPanel) return;

    const isMobile = () => window.innerWidth < 980;

    const handleFocusIn = (event: FocusEvent) => {
      if (!isMobile()) return;
      const target = event.target as HTMLElement;
      const isFormField = target.matches('input, textarea, select');
      if (!isFormField) return;

      setTimeout(() => {
        const panelRect = formPanel.getBoundingClientRect();
        const fieldRect = target.getBoundingClientRect();
        const isBelowViewport = fieldRect.bottom > panelRect.bottom;
        const isAboveViewport = fieldRect.top < panelRect.top;

        if (isBelowViewport || isAboveViewport) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          formPanel.scrollTop -= 20;
        }
      }, 350);
    };

    formPanel.addEventListener('focusin', handleFocusIn);
    return () => formPanel.removeEventListener('focusin', handleFocusIn);
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  const handleConfirmData = useCallback(() => {
    setIsDataConfirmed(true);
  }, []);

  const handleReset = useCallback(() => {
    setIsDataConfirmed(false);
    resetCertificate();
  }, [resetCertificate]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const mobileQuery = window.matchMedia('(max-width: 980px)');
    const previousOverflow = document.body.style.overflow;
    if (!mobileQuery.matches) {
      document.body.style.overflow = 'hidden';
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="certificate-module" role="dialog" aria-modal="true" aria-labelledby="certificate-module-title">
      <div className="certificate-module__topbar">
        <div>
          <span>Modo Documento</span>
          <h1 id="certificate-module-title">Documento interno</h1>
        </div>
        <button className="certificate-close-action" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="certificate-module__workspace">
        <aside className="certificate-module__form-panel">
          <CertificateForm
            data={certificateData}
            onReset={handleReset}
            onUpdate={updateField}
          />
        </aside>

        <section className="certificate-module__preview-panel" aria-label="Vista previa del documento">
          {isDataConfirmed ? (
            <>
              <div className="certificate-preview-shell">
                <CertificatePreview ref={previewRef} data={certificateData} />
              </div>
              <PdfActions certificateData={certificateData} previewRef={previewRef} />
            </>
          ) : (
            <div className="certificate-preview-empty" aria-live="polite">
              <strong>Documento pendiente</strong>
              <span>Confirma que los datos ingresados son correctos para ver el documento.</span>
              <button className="certificate-primary-action" type="button" onClick={handleConfirmData}>
                Sí, son correctos
              </button>
            </div>
          )}
        </section>
      </div>
    </div>,
    document.body,
  );
});

export { EmbalmingCertificateModule };
