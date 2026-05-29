// ===== CERTIFICATE MODULE =====
// Hook de correo. Recibe un generador de PDF y envía el Blob real como adjunto
// mediante el servicio multipart/form-data.

import { useCallback, useState } from 'react';
import { sendCertificateEmail } from '../services/email';
import type { CertificateData } from '../types';

type UseEmailSenderParams = {
  certificateData: CertificateData;
  createPdfBlob: () => Promise<Blob>;
  filename: string;
};

export function useEmailSender({
  certificateData,
  createPdfBlob,
  filename,
}: UseEmailSenderParams) {
  const [isSending, setIsSending] = useState(false);

  const sendEmail = useCallback(
    async (recipientEmail: string) => {
      setIsSending(true);

      try {
        const pdfBlob = await createPdfBlob();
        await sendCertificateEmail({
          certificateData,
          filename,
          pdfBlob,
          recipientEmail,
        });
      } finally {
        setIsSending(false);
      }
    },
    [certificateData, createPdfBlob, filename],
  );

  return {
    isSending,
    sendEmail,
  };
}
