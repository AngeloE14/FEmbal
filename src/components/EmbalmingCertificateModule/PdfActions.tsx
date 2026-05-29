// ===== CERTIFICATE MODULE =====
// Toolbar de acciones. El PDF se genera bajo demanda para evitar lag al escribir.

import { memo, useCallback, useState } from 'react';
import type { RefObject } from 'react';
import { Download, Mail, Printer } from 'lucide-react';
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
  const [status, setStatus] = useState<ActionStatus>(null);
  const { createPdfBlob, downloadPdf, filename, isGenerating } = usePdfGenerator(certificateData, previewRef);
  const { isSending, sendEmail } = useEmailSender({
    certificateData,
    createPdfBlob,
    filename,
  });

  const handleDownload = useCallback(async () => {
    setStatus(null);

    try {
      await downloadPdf();
      setStatus({ message: 'PDF generado correctamente.', type: 'success' });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF.',
        type: 'error',
      });
    }
  }, [downloadPdf]);

  const handlePrint = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  const handleSendEmail = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setStatus({ message: 'Escribe un correo destino válido.', type: 'error' });
      return;
    }

    setStatus(null);

    try {
      await sendEmail(normalizedEmail);
      setStatus({ message: 'Certificado enviado por correo correctamente.', type: 'success' });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
        type: 'error',
      });
    }
  }, [email, sendEmail]);

  return (
    <section className="certificate-actions" aria-label="Acciones del certificado">
      <button
        className="certificate-primary-action"
        disabled={isGenerating || isSending}
        type="button"
        onClick={handleDownload}
      >
        <Download aria-hidden="true" size={18} strokeWidth={2.2} />
        {isGenerating ? 'Generando PDF...' : 'GENERAR CERTIFICADO DE EMBALSAMAMIENTO'}
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
          {isSending ? 'Enviando...' : 'Enviar por correo'}
        </button>
      </div>
      {status ? (
        <p className={`certificate-action-status certificate-action-status--${status.type}`}>
          {status.message}
        </p>
      ) : null}
    </section>
  );
});
