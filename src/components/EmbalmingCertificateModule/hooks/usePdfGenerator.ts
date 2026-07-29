// ===== HOOK DE PDF =====
// Este hook reúne la lógica para generar y descargar el PDF.
// Separarlo del componente visual ayuda a que los botones sean más simples.

import { useCallback, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import {
  buildCertificateFilename,
  downloadBlob,
  generateCertificatePdfBlob,
} from '../services/pdf';
import type { PdfOptions } from '../services/pdf';
import type { CertificateData } from '../types';

export function usePdfGenerator(
  certificateData: CertificateData,
  previewRef: RefObject<HTMLDivElement | null>,
) {
  const [isGenerating, setIsGenerating] = useState(false);

  // El nombre del archivo usa el nombre de la persona fallecida y la fecha.
  // useMemo evita recalcularlo en cada render si los datos no cambiaron.
  const filename = useMemo(() => buildCertificateFilename(certificateData), [certificateData]);

  const createPdfBlob = useCallback(async (targetElement?: HTMLElement | null, options?: PdfOptions) => {
    const previewElement = targetElement ?? previewRef.current;

    if (!previewElement) {
      throw new Error('No se encontró la vista previa del documento.');
    }

    return generateCertificatePdfBlob(previewElement, options);
  }, [previewRef]);

  const downloadPdf = useCallback(async (targetElement?: HTMLElement | null, options?: PdfOptions) => {
    setIsGenerating(true);

    try {
      // Primero generamos el Blob del PDF y luego lo descargamos.
      // Blob significa "archivo en memoria" dentro del navegador.
      const blob = await createPdfBlob(targetElement, options);
      downloadBlob(blob, filename);
      return blob;
    } finally {
      setIsGenerating(false);
    }
  }, [createPdfBlob, filename]);

  return {
    createPdfBlob,
    downloadPdf,
    filename,
    isGenerating,
  };
}
