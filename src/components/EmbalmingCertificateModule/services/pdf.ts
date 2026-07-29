// ===== SERVICIO DE PDF =====
// ¿Qué hace este archivo?
//   Toma una "foto" del documento HTML (con html2canvas) y la pega dentro
//   de un archivo PDF (con jsPDF) listo para descargar o imprimir.
//
// ¿Por qué una sola hoja vertical (portrait)?
//   - El PDF se crea en formato CARTA (letter: 215.9mm × 279.4mm).
//   - orientation: 'portrait' lo pone VERTICAL (la hoja parada).
//   - La imagen capturada se REDIMENSIONA para que quepa dentro de la hoja
//     sin recortarse. Si el contenido es más alto que la hoja, lo encoge
//     hasta que entre (líneas 143-147).
//   - Así aseguramos que TODO el documento quepa en UNA sola página.
//
// Flujo:
//   1. Clonamos el elemento HTML (para no alterar lo que ve el usuario).
//   2. Forzamos a cargar las imágenes (si tienen loading="lazy").
//   3. html2canvas convierte el HTML en un canvas (una imagen plana).
//   4. jsPDF pone esa imagen dentro de un PDF vertical tamaño carta.
//   5. Devolvemos el PDF como un Blob (un archivo en memoria).

import type { CertificateData } from '../types';

// Tamaño de una hoja carta en milímetros (215.9mm × 279.4mm).
// En pulgadas sería 8.5in × 11in.
const LETTER_WIDTH_MM = 215.9;
const LETTER_HEIGHT_MM = 279.4;

// Convierte un texto en un nombre de archivo seguro (sin acentos, espacios, etc.)
// Ejemplo: "José Pérez" → "jose-perez"
const normalizeFilenamePart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildCertificateFilename = (data: CertificateData) => {
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
  // Cargamos html2canvas y jsPDF solo cuando se necesitan (lazy import).
  // Así la página inicial no se vuelve pesada.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Esperamos un frame (16ms) para que el navegador termine de pintar.
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  // Clonamos el elemento para no modificar la preview visible.
  const exportElement = element.cloneNode(true) as HTMLElement;
  exportElement.classList.add('certificate-preview-document--exporting');
  exportElement.setAttribute('aria-hidden', 'true');

  // content-visibility: auto hace que el navegador no renderice el elemento
  // cuando está fuera de pantalla. html2canvas no podría capturarlo, así que
  // lo desactivamos.
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

  // Colocamos el clon en el body (fuera de pantalla, posición fija a la izquierda).
  document.body.append(exportElement);

  // Esperamos a que las imágenes se carguen antes de capturar.
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

  // Escala: a mayor escala, más nitidez pero más peso.
  // En móvil usamos 1.5, en desktop 2-3.
  const scale = options?.scale ?? Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  let canvas: HTMLCanvasElement;

  try {
    // html2canvas convierte el HTML en una imagen (canvas).
    canvas = await html2canvas(exportElement, {
      backgroundColor: '#ffffff',
      logging: false,      // No mostrar logs de html2canvas en consola
      scale,
      useCORS: true,       // Permitir imágenes de otros dominios
      windowHeight: exportElement.scrollHeight,
      windowWidth: exportElement.scrollWidth,
    });
  } finally {
    // Limpiamos: quitamos el clon del body para no dejar basura.
    exportElement.remove();
  }

  // Creamos el PDF en orientación VERTICAL (portrait) y tamaño CARTA.
  // compress: true reduce el tamaño del archivo.
  const pdf = new jsPDF({
    format: 'letter',
    orientation: 'portrait', // ← VERTICAL, como una hoja de carta parada
    unit: 'mm',
    compress: true,
  });

  const imageFormat = (options?.imageFormat || 'PNG').toLowerCase();
  const imageQuality = options?.imageQuality ?? 1;
  const imageData = canvas.toDataURL(`image/${imageFormat}`, imageQuality);

  const pageWidth = LETTER_WIDTH_MM;
  const pageHeight = LETTER_HEIGHT_MM;
  const imgAspect = canvas.width / canvas.height;

  // ===== CÓMO ASEGURAMOS QUE QUEPA EN UNA HOJA =====
  // 1. Intentamos que la imagen mida lo mismo que el ancho de la hoja.
  // 2. Si la imagen es más alta que la hoja, la encogemos hasta que
  //    su altura coincida con la hoja (y el ancho se ajusta).
  // 3. Centramos la imagen en la hoja con xOffset, yOffset.
  //
  // Esto garantiza que TODO el contenido esté en UNA sola página,
  // sin cortes ni páginas extra.
  let renderWidth = pageWidth;
  let renderHeight = pageWidth / imgAspect;

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = pageHeight * imgAspect;
  }

  const xOffset = (pageWidth - renderWidth) / 2;
  const yOffset = (pageHeight - renderHeight) / 2;

  // Pegamos la imagen dentro del PDF.
  pdf.addImage(imageData, imageFormat.toUpperCase() as 'PNG' | 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

  // Devolvemos el PDF como un Blob (archivo binario en memoria).
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
