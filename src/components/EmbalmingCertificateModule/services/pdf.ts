// ===== CERTIFICATE MODULE =====
// Generación PDF bajo demanda. html2canvas captura la preview HTML optimizada y
// jsPDF la escala a carta; esto evita bloquear la UI mientras la persona escribe.

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
  const name = normalizeFilenamePart(data.deceasedName) || 'certificado';
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const date = data.procedureDate || today;

  return `certificado-embalsamamiento-${name}-${date}.pdf`;
};

export const generateCertificatePdfBlob = async (element: HTMLElement): Promise<Blob> => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    scale,
    useCORS: true,
    windowHeight: element.scrollHeight,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({
    format: 'letter',
    orientation: 'portrait',
    unit: 'mm',
    compress: true,
  });

  const imageData = canvas.toDataURL('image/png', 1);
  const renderedHeight = (canvas.height * LETTER_WIDTH_MM) / canvas.width;
  let remainingHeight = renderedHeight;
  let position = 0;

  pdf.addImage(imageData, 'PNG', 0, position, LETTER_WIDTH_MM, renderedHeight);
  remainingHeight -= LETTER_HEIGHT_MM;

  while (remainingHeight > 0) {
    position -= LETTER_HEIGHT_MM;
    pdf.addPage('letter', 'portrait');
    pdf.addImage(imageData, 'PNG', 0, position, LETTER_WIDTH_MM, renderedHeight);
    remainingHeight -= LETTER_HEIGHT_MM;
  }

  return pdf.output('blob');
};

export const downloadBlob = (blob: Blob, filename: string) => {
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
