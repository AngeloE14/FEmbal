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

export const generateCertificatePdfBlob = async (element: HTMLElement): Promise<Blob> => {
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
  document.body.append(exportElement);

  const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
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

  const imageData = canvas.toDataURL('image/png', 1);
  // El equipo pidió que el documento salga en una sola hoja.
  // Por eso colocamos la imagen completa dentro de una sola página y no
  // agregamos páginas extra aunque el contenido sea largo.
  pdf.addImage(imageData, 'PNG', 0, 0, LETTER_WIDTH_MM, LETTER_HEIGHT_MM);

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
