// ===== CERTIFICATE MODULE =====
// Servicio de correo. Envía multipart/form-data para que un backend
// Node/Nodemailer, serverless function o endpoint equivalente reciba un PDF real.

import type { CertificateData } from '../types';

type SendCertificateEmailParams = {
  certificateData: CertificateData;
  filename: string;
  pdfBlob: Blob;
  recipientEmail: string;
};

const getEmailEndpoint = () =>
  import.meta.env.VITE_CERTIFICATE_EMAIL_API_URL || '/api/certificates/email';

export const sendCertificateEmail = async ({
  certificateData,
  filename,
  pdfBlob,
  recipientEmail,
}: SendCertificateEmailParams) => {
  const formData = new FormData();
  const typedPdfBlob = pdfBlob.type === 'application/pdf'
    ? pdfBlob
    : new Blob([pdfBlob], { type: 'application/pdf' });

  formData.append('recipientEmail', recipientEmail);
  formData.append('certificate', JSON.stringify(certificateData));
  formData.append('attachment', typedPdfBlob, filename);

  const response = await fetch(getEmailEndpoint(), {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    let message = 'No se pudo enviar el certificado por correo.';

    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      message = payload.message || payload.error || message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json().catch(() => ({ ok: true }));
};
