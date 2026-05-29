// ===== SERVICIO DE CORREO DEL FRONTEND =====
// Este archivo prepara la petición que viaja del navegador al servidor Express.
// El navegador no puede usar SMTP directamente, por eso mandamos el PDF al
// backend y el backend se encarga de hablar con el proveedor de correo.

type SendCertificateEmailParams = {
  filename: string;
  pdfBlob: Blob;
  recipientEmail: string;
};

export const certificateEmailMessage = 'Documento enviado por la pagina web.';

// Esta URL apunta al endpoint de correo. En desarrollo usamos el proxy de Vite;
// en producción se puede cambiar con VITE_DOCUMENT_EMAIL_API_URL.
const getEmailEndpoint = () =>
  import.meta.env.VITE_DOCUMENT_EMAIL_API_URL || '/api/documents/email';

export const sendCertificateEmail = async ({
  filename,
  pdfBlob,
  recipientEmail,
}: SendCertificateEmailParams) => {
  const formData = new FormData();

  // Nos aseguramos de que el archivo tenga tipo application/pdf.
  // Algunos navegadores pueden crear Blobs sin tipo y el backend lo rechazaría.
  const typedPdfBlob = pdfBlob.type === 'application/pdf'
    ? pdfBlob
    : new Blob([pdfBlob], { type: 'application/pdf' });

  formData.append('recipientEmail', recipientEmail);
  formData.append('message', certificateEmailMessage);
  formData.append('attachment', typedPdfBlob, filename);

  // fetch envía los datos al servidor. Si el servidor responde con error,
  // leemos su mensaje para mostrar una explicación clara al usuario.
  const response = await fetch(getEmailEndpoint(), {
    body: formData,
    method: 'POST',
  });

  if (!response.ok) {
    let message = 'No se pudo enviar el documento por correo.';

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
