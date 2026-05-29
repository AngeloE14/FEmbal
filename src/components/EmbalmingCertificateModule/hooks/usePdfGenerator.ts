// ===== CERTIFICATE MODULE =====
// Hook de PDF. Mantiene el trabajo pesado fuera del render:
// sólo genera Blob/descarga cuando el usuario pulsa una acción.

import { useCallback, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import {
  buildCertificateFilename,
  downloadBlob,
  generateCertificatePdfBlob,
} from '../services/pdf';
import type { CertificateData } from '../types';

export function usePdfGenerator(
  certificateData: CertificateData,
  previewRef: RefObject<HTMLDivElement | null>,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const filename = useMemo(() => buildCertificateFilename(certificateData), [certificateData]);

  const createPdfBlob = useCallback(async () => {
    const previewElement = previewRef.current;

    if (!previewElement) {
      throw new Error('No se encontró la vista previa del certificado.');
    }

    return generateCertificatePdfBlob(previewElement);
  }, [previewRef]);

  const downloadPdf = useCallback(async () => {
    setIsGenerating(true);

    try {
      const blob = await createPdfBlob();
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
