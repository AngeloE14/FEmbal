import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CertificateForm } from './CertificateForm';
import { CertificatePreview } from './CertificatePreview';
import './EmbalmingCertificateModule.css';
import { PdfActions } from './PdfActions';
import { useCertificateData } from './hooks/useCertificateData';
import { useCertificateSync } from './hooks/useCertificateSync';
import { isCertificateDataComplete } from './types';

// Este componente abre el módulo completo en un portal.
// Un portal permite dibujar la pantalla encima de toda la app sin depender del
// lugar donde se encuentre el botón que la abre.
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

  // Estos estados controlan que la vista previa solo aparezca después de que
  // todos los campos requeridos estén llenos y la persona confirme los datos.
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmDismissed, setIsConfirmDismissed] = useState(false);
  const isComplete = useMemo(() => isCertificateDataComplete(certificateData), [certificateData]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    // Si cualquier dato cambia, pedimos confirmar otra vez.
    // Esto evita generar un PDF con información editada sin revisar.
    setIsDataConfirmed(false);
    setIsConfirmDismissed(false);
  }, [certificateData]);

  useEffect(() => {
    // Cuando el formulario queda completo, abrimos el diálogo de confirmación.
    // Si la persona elige revisar, no lo abrimos en bucle hasta que pulse
    // "Confirmar datos" manualmente.
    if (isOpen && isComplete && !isDataConfirmed && !isConfirmDismissed) {
      setIsConfirmOpen(true);
    } else {
      setIsConfirmOpen(false);
    }
  }, [isComplete, isConfirmDismissed, isDataConfirmed, isOpen]);

  const handleConfirmData = useCallback(() => {
    setIsDataConfirmed(true);
    setIsConfirmOpen(false);
  }, []);

  const handleReviewData = useCallback(() => {
    setIsConfirmDismissed(true);
    setIsConfirmOpen(false);
  }, []);

  const handleOpenDataConfirmation = useCallback(() => {
    if (isComplete) {
      setIsConfirmDismissed(false);
      setIsConfirmOpen(true);
    }
  }, [isComplete]);

  const handleReset = useCallback(() => {
    setIsDataConfirmed(false);
    setIsConfirmDismissed(false);
    setIsConfirmOpen(false);
    resetCertificate();
  }, [resetCertificate]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    // Bloqueamos el scroll del fondo mientras el módulo está abierto.
    // Así el usuario no mueve la página principal por accidente.
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
          {isComplete && isDataConfirmed ? (
            <>
              <div className="certificate-preview-shell">
                <CertificatePreview ref={previewRef} data={certificateData} />
              </div>
              <PdfActions certificateData={certificateData} previewRef={previewRef} />
            </>
          ) : isComplete ? (
            <div className="certificate-preview-empty" aria-live="polite">
              <strong>Documento pendiente</strong>
              <span>Confirma la información para ver o generar el documento.</span>
              <button className="certificate-primary-action" type="button" onClick={handleOpenDataConfirmation}>
                Confirmar datos
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {isConfirmOpen ? (
        <div className="certificate-data-confirm" role="dialog" aria-modal="true" aria-labelledby="certificate-data-confirm-title">
          <div className="certificate-data-confirm__panel">
            <h2 id="certificate-data-confirm-title">¿Los datos ingresados son correctos?</h2>
            <div className="certificate-data-confirm__actions">
              <button className="certificate-secondary-action" type="button" onClick={handleReviewData}>
                Revisar
              </button>
              <button className="certificate-primary-action" type="button" onClick={handleConfirmData}>
                Sí, mostrar documento
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
});
