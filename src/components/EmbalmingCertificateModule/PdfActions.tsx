import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Download, Mail, Printer, X } from 'lucide-react';
import { CertificatePreview } from './CertificatePreview';
import { useEmailSender } from './hooks/useEmailSender';
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Spinner = () => <span className="certificate-spinner" aria-hidden="true" />;

const PdfActions = memo(function PdfActions({
  certificateData,
  previewRef,
}: PdfActionsProps) {
  const [email, setEmail] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [status, setStatus] = useState<ActionStatus>(null);
  const [statusKey, setStatusKey] = useState(0);
  const confirmPreviewRef = useRef<HTMLDivElement | null>(null);
  const { createPdfBlob, downloadPdf, filename, isGenerating } = usePdfGenerator(certificateData, previewRef);
  const { isSending, sendEmail } = useEmailSender({
    createPdfBlob,
    filename,
  });

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
      await downloadPdf(confirmPreviewRef.current);
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

  const handleSendEmail = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      showStatus({ message: 'Escribe un correo destino válido.', type: 'error' });
      return;
    }

    showStatus(null);

    try {
      await sendEmail(normalizedEmail);
      showStatus({ message: 'Documento enviado por correo correctamente.', type: 'success' });
    } catch (error) {
      showStatus({
        message: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
        type: 'error',
      });
    }
  }, [email, sendEmail, showStatus]);

  const emailValidationClass = email.length > 0
    ? (emailPattern.test(email) ? 'certificate-field--valid' : 'certificate-field--invalid')
    : '';

  const sendBtnClass = [
    'certificate-secondary-action',
    isSending ? 'certificate-action--sending' : '',
  ].filter(Boolean).join(' ');

  return (
    <section className="certificate-actions" aria-label="Acciones del documento">
      <button
        className="certificate-primary-action"
        disabled={isGenerating || isSending}
        type="button"
        onClick={openDownloadConfirmation}
      >
        <Download aria-hidden="true" size={18} strokeWidth={2.2} />
        GENERAR DOCUMENTO
      </button>
      <button
        className="certificate-secondary-action"
        disabled={isGenerating || isSending}
        type="button"
        onClick={handlePrint}
      >
        <Printer aria-hidden="true" size={17} strokeWidth={2.2} />
        Imprimir
      </button>
      <div className="certificate-email-action">
        <label className={`certificate-field ${emailValidationClass}`}>
          <span>Correo destino</span>
          <input
            autoComplete="email"
            inputMode="email"
            placeholder="correo@dominio.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button
          className={sendBtnClass}
          disabled={isGenerating || isSending}
          type="button"
          onClick={handleSendEmail}
        >
          {isSending ? <Spinner /> : <Mail aria-hidden="true" size={17} strokeWidth={2.2} />}
          {isSending ? 'Enviando...' : 'Enviar documento'}
        </button>
      </div>
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
