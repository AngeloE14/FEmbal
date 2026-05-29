import { useCallback, useState } from 'react';
import { sendCertificateEmail } from '../services/emailjs';

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
