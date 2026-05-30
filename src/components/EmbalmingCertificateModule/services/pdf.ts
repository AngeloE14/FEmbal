// ===== SERVICIO DE PDF =====
// html2canvas toma una "foto" del HTML del documento.
// jsPDF coloca esa imagen dentro de un archivo PDF descargable.

import type { CertificateData } from '../types';

const LETTER_WIDTH_MM = 215.9;
const LETTER_HEIGHT_MM = 279.4;

const normalizeFilenamePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildCertificateFilename = (data: CertificateData) => {
  // Limpiamos el nombre para que sea seguro como nombre de archivo.
  // Por ejemplo: "José Pérez" se vuelve "jose-perez".
  const name = normalizeFilenamePart(data.deceasedName) || 'documento';
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const date = data.procedureDate || today;

  return `documento-embalsamamiento-${name}-${date}.pdf`;
};

export type PdfOptions = {
  scale?: number;
  imageFormat?: 'PNG' | 'JPEG';
  imageQuality?: number;
};

export const generateCertificatePdfBlob = async (element: HTMLElement, options?: PdfOptions): Promise<Blob> => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  // Capturamos un clon de tamaño final para que el PDF sea consistente aunque
  // la preview visible esté reducida en móvil.
  const exportElement = element.cloneNode(true) as HTMLElement;
  exportElement.classList.add('certificate-preview-document--exporting');
  exportElement.setAttribute('aria-hidden', 'true');

  // content-visibility: auto hace que el navegador no renderice el elemento
  // cuando está fuera de pantalla (left: -10000px). html2canvas capturaría
  // algo vacío, así que lo desactivamos junto con contain.
  exportElement.style.removeProperty('content-visibility');
  exportElement.style.removeProperty('contain');

  // Las imágenes con loading="lazy" no se cargan si el elemento está
  // fuera de la pantalla. Las forzamos a cargar normal.
  exportElement.querySelectorAll('img[loading]').forEach(img => img.removeAttribute('loading'));

  // Las variables CSS (--certificate-doc-accent, --certificate-doc-gold, etc.)
  // se definen en .certificate-module. Al clonar el elemento y colocarlo fuera
  // de ese contexto (directamente en document.body), las variables dejan de
  // resolverse. Aquí copiamos sus valores calculados para conservar los colores.
  const computed = getComputedStyle(element);
  for (const prop of ['--certificate-doc-accent', '--certificate-doc-gold', '--certificate-doc-accent-strong', '--certificate-doc-accent-soft']) {
    const value = computed.getPropertyValue(prop).trim();
    if (value) {
      exportElement.style.setProperty(prop, value);
    }
  }

  document.body.append(exportElement);

  // Esperamos a que las imágenes se carguen antes de capturar
  const images = Array.from(exportElement.querySelectorAll('img'));
  await Promise.allSettled(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );

  const scale = options?.scale ?? Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  let canvas: HTMLCanvasElement;

  try {
    canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      logging: false,
      scale,
      useCORS: true,
      windowHeight: exportElement.scrollHeight,
      windowWidth: exportElement.scrollWidth,
    });
  } finally {
    exportElement.remove();
  }

  const pdf = new jsPDF({
    format: 'letter',
    orientation: 'portrait',
    unit: 'mm',
    compress: true,
  });

  const imageFormat = (options?.imageFormat || 'PNG').toLowerCase();
  const imageQuality = options?.imageQuality ?? 1;
  const imageData = canvas.toDataURL(`image/${imageFormat}`, imageQuality);

  const pageWidth = LETTER_WIDTH_MM;
  const pageHeight = LETTER_HEIGHT_MM;
  const imgAspect = canvas.width / canvas.height;

  let renderWidth = pageWidth;
  let renderHeight = pageWidth / imgAspect;

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = pageHeight * imgAspect;
  }

  const xOffset = (pageWidth - renderWidth) / 2;
  const yOffset = (pageHeight - renderHeight) / 2;

  pdf.addImage(imageData, imageFormat.toUpperCase() as 'PNG' | 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

  return pdf.output('blob');
};

export const downloadBlob = (blob: Blob, filename: string) => {
  // Creamos un enlace temporal para que el navegador descargue el archivo.
  // Luego liberamos la URL temporal para no dejar memoria ocupada.
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 500);
};
