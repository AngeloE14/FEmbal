import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { CertificatePreview } from './CertificatePreview';
import { usePdfGenerator } from './hooks/usePdfGenerator';
import type { CertificateData } from './types';

type PdfActionsProps = {
  certificateData: CertificateData;
  previewRef: RefObject<HTMLDivElement | null>;
};

type ActionStatus = {
  message: string;
  type: 'error' | 'success';
} | null;

const PdfActions = memo(function PdfActions({
  certificateData,
  previewRef,
}: PdfActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [status, setStatus] = useState<ActionStatus>(null);
  const [statusKey, setStatusKey] = useState(0);
  const confirmPreviewRef = useRef<HTMLDivElement | null>(null);
  const { downloadPdf, isGenerating } = usePdfGenerator(certificateData, previewRef);

  const showStatus = useCallback((newStatus: ActionStatus) => {
    setStatusKey((k) => k + 1);
    setStatus(newStatus);
  }, []);

  const openDownloadConfirmation = useCallback(() => {
    showStatus(null);
    setIsConfirmOpen(true);
  }, [showStatus]);

  const closeDownloadConfirmation = useCallback(() => {
    if (!isGenerating) {
      setIsConfirmOpen(false);
    }
  }, [isGenerating]);

  const handleConfirmedDownload = useCallback(async () => {
    showStatus(null);

    try {
      const isCompactViewport = window.matchMedia('(max-width: 640px)').matches;
      await downloadPdf(confirmPreviewRef.current, isCompactViewport ? { imageFormat: 'JPEG', imageQuality: 0.92, scale: 1.5 } : undefined);
      setIsConfirmOpen(false);
      showStatus({ message: 'PDF generado correctamente.', type: 'success' });
    } catch (error) {
      showStatus({
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF.',
        type: 'error',
      });
    }
  }, [downloadPdf, showStatus]);

  useEffect(() => {
    if (!isConfirmOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDownloadConfirmation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDownloadConfirmation, isConfirmOpen]);

  const handlePrint = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  return (
    <section className="certificate-actions" aria-label="Acciones del documento">
      <button
        className="certificate-primary-action"
        disabled={isGenerating}
        type="button"
        onClick={openDownloadConfirmation}
      >
        <Download aria-hidden="true" size={18} strokeWidth={2.2} />
        GENERAR DOCUMENTO
      </button>
      <button
        className="certificate-secondary-action"
        disabled={isGenerating}
        type="button"
        onClick={handlePrint}
      >
        <Printer aria-hidden="true" size={17} strokeWidth={2.2} />
        Imprimir
      </button>
      {status ? (
        <p
          key={statusKey}
          className={`certificate-action-status certificate-action-status--${status.type} certificate-action-status--entering`}
        >
          {status.message}
        </p>
      ) : null}

      {isConfirmOpen ? (
        <div className="certificate-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-confirm-title">
          <div className="certificate-confirm-modal__panel">
            <div className="certificate-confirm-modal__head">
              <div>
                <span>Vista final</span>
                <h2 id="certificate-confirm-title">¿Desea generar y descargar el documento?</h2>
              </div>
              <button
                aria-label="Cancelar generación"
                className="certificate-confirm-modal__close"
                disabled={isGenerating}
                type="button"
                onClick={closeDownloadConfirmation}
              >
                <X aria-hidden="true" size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="certificate-confirm-modal__preview" aria-label="Vista previa final del documento">
              <CertificatePreview ref={confirmPreviewRef} data={certificateData} />
            </div>

            <div className="certificate-confirm-modal__actions">
              <button
                className="certificate-secondary-action"
                disabled={isGenerating}
                type="button"
                onClick={closeDownloadConfirmation}
              >
                Cancelar
              </button>
              <button
                className="certificate-primary-action"
                disabled={isGenerating}
                type="button"
                onClick={handleConfirmedDownload}
              >
                <Download aria-hidden="true" size={18} strokeWidth={2.2} />
                {isGenerating ? 'Generando PDF...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

export { PdfActions };
