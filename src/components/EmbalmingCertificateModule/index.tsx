import { memo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CertificateForm } from './CertificateForm';
import { CertificatePreview } from './CertificatePreview';
import './EmbalmingCertificateModule.css';
import { PdfActions } from './PdfActions';
import { useCertificateData } from './hooks/useCertificateData';
import { useCertificateSync } from './hooks/useCertificateSync';

type EmbalmingCertificateModuleProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const EmbalmingCertificateModule = memo(function EmbalmingCertificateModule({
  isOpen,
  onClose,
}: EmbalmingCertificateModuleProps) {
  const { certificateData: manualCertificateData, resetCertificate, updateField } = useCertificateData();
  const certificateData = useCertificateSync(manualCertificateData);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
          <span>Modo Certificado</span>
          <h1 id="certificate-module-title">Certificado de Embalsamamiento</h1>
        </div>
        <button className="certificate-close-action" type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="certificate-module__workspace">
        <aside className="certificate-module__form-panel">
          <CertificateForm
            data={certificateData}
            onReset={resetCertificate}
            onUpdate={updateField}
          />
        </aside>

        <section className="certificate-module__preview-panel" aria-label="Vista previa del certificado">
          <div className="certificate-preview-shell">
            <CertificatePreview ref={previewRef} data={certificateData} />
          </div>
          <PdfActions certificateData={certificateData} previewRef={previewRef} />
        </section>
      </div>
    </div>,
    document.body,
  );
});
