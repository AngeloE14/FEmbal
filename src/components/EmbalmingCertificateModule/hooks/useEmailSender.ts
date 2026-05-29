// ===== HOOK DE ENVÍO POR CORREO =====
// Un hook guarda lógica reutilizable de React. Aquí controlamos cuándo se está
// enviando el correo y pedimos al generador que cree el PDF justo antes de enviarlo.

import { useCallback, useState } from 'react';
import { sendCertificateEmail } from '../services/email';

type UseEmailSenderParams = {
  createPdfBlob: () => Promise<Blob>;
  filename: string;
};

export function useEmailSender({
  createPdfBlob,
  filename,
}: UseEmailSenderParams) {
  const [isSending, setIsSending] = useState(false);

  const sendEmail = useCallback(
    async (recipientEmail: string) => {
      setIsSending(true);

      try {
        // El PDF se crea en este momento para adjuntar la versión más reciente
        // del documento, con los datos ya confirmados por el usuario.
        const pdfBlob = await createPdfBlob();
        await sendCertificateEmail({
          filename,
          pdfBlob,
          recipientEmail,
        });
      } finally {
        setIsSending(false);
      }
    },
    [createPdfBlob, filename],
  );

  return {
    isSending,
    sendEmail,
  };
}
