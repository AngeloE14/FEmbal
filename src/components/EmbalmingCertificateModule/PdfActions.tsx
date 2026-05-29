// ===== ACCIONES DEL DOCUMENTO =====
// Este componente contiene los botones para imprimir, generar PDF y enviar correo.
// El PDF se crea solo cuando la persona pulsa un botón; así el formulario no se
// vuelve lento mientras alguien escribe.

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

export const PdfActions = memo(function PdfActions({
  certificateData,
  previewRef,
}: PdfActionsProps) {
  const [email, setEmail] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [status, setStatus] = useState<ActionStatus>(null);
  const confirmPreviewRef = useRef<HTMLDivElement | null>(null);
  const { createPdfBlob, downloadPdf, filename, isGenerating } = usePdfGenerator(certificateData, previewRef);
  const { isSending, sendEmail } = useEmailSender({
    createPdfBlob,
    filename,
  });

  // Abrimos una confirmación antes de descargar para evitar generar archivos
  // por accidente. La vista final usa el mismo componente que el PDF.
  const openDownloadConfirmation = useCallback(() => {
    setStatus(null);
    setIsConfirmOpen(true);
  }, []);

  const closeDownloadConfirmation = useCallback(() => {
    if (!isGenerating) {
      setIsConfirmOpen(false);
    }
  }, [isGenerating]);

  const handleConfirmedDownload = useCallback(async () => {
    setStatus(null);

    try {
      await downloadPdf(confirmPreviewRef.current);
      setIsConfirmOpen(false);
      setStatus({ message: 'PDF generado correctamente.', type: 'success' });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF.',
        type: 'error',
      });
    }
  }, [downloadPdf]);

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

  // Este flujo acepta cualquier correo escrito por el usuario.
  // Primero validamos el formato y después mandamos el PDF al backend SMTP.
  const handleSendEmail = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setStatus({ message: 'Escribe un correo destino válido.', type: 'error' });
      return;
    }

    setStatus(null);

    try {
      await sendEmail(normalizedEmail);
      setStatus({ message: 'Documento enviado por correo correctamente.', type: 'success' });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'No se pudo enviar el correo. Revisa la configuración SMTP.',
        type: 'error',
      });
    }
  }, [email, sendEmail]);

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
        <label className="certificate-field">
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
          className="certificate-secondary-action"
          disabled={isGenerating || isSending}
          type="button"
          onClick={handleSendEmail}
        >
          <Mail aria-hidden="true" size={17} strokeWidth={2.2} />
          {isSending ? 'Enviando...' : 'Enviar documento'}
        </button>
      </div>
      {status ? (
        <p className={`certificate-action-status certificate-action-status--${status.type}`}>
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
