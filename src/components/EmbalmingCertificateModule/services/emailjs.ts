type SendCertificateEmailParams = {
  filename: string;
  pdfBlob: Blob;
  recipientEmail: string;
};

type EmailJSConfig = {
  publicKey: string;
  serviceId: string;
  templateId: string;
};

function getConfig(): EmailJSConfig {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

  return { publicKey, serviceId, templateId };
}

export const sendCertificateEmail = async ({
  filename,
  pdfBlob,
  recipientEmail,
}: SendCertificateEmailParams) => {
  const { publicKey, serviceId, templateId } = getConfig();

  if (!publicKey || !serviceId || !templateId) {
    throw new Error(
      'Falta configurar EmailJS. Revisa VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID y VITE_EMAILJS_TEMPLATE_ID en el archivo .env'
    );
  }

  const formData = new FormData();

  formData.append('user_id', publicKey);
  formData.append('service_id', serviceId);
  formData.append('template_id', templateId);
  formData.append('template_params[to_email]', recipientEmail);
  formData.append('template_params[subject]', 'Documento ESAMS');
  formData.append('template_params[message]', 'Documento enviado por la página web.');

  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
  formData.append('attachment', pdfFile, filename);

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send-form', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const message = text || 'No se pudo enviar el documento por correo.';
    throw new Error(message);
  }

  return { ok: true };
};
