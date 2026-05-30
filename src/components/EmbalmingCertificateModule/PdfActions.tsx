// ===== ACCIONES DEL PDF (DESCARGAR / IMPRIMIR) =====
// Este componente dibuja los botones "GENERAR DOCUMENTO" e "Imprimir".
// También maneja el modal de confirmación antes de generar el PDF.
// 
// La generación del PDF usa el ref (confirmPreviewRef) de la vista previa
// para capturarla con html2canvas y plasmarla en un PDF tamaño carta vertical.
// 
// En móvil (≤640px) se usa JPEG con calidad 0.92 y escala 1.5 para que
// el PDF sea más ligero y rápido de generar.
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { CertificatePreview } from './CertificatePreview';
import { usePdfGenerator } from './hooks/usePdfGenerator';
import type { CertificateData } from './types';

type PdfActionsProps = {
  certificateData: CertificateData;
  previewRef: RefObject<HTMLDivElement | null>;
};

type ActionStatus = {
  message: string;
  type: 'error' | 'success';
} | null;

const COLLECTED_VARS = ['--certificate-doc-accent', '--certificate-doc-accent-strong', '--certificate-doc-accent-soft', '--certificate-doc-gold'] as const;

const collectCssVars = (): string => {
  const moduleEl = document.querySelector('.certificate-module');
  if (!moduleEl) return '';
  const computed = getComputedStyle(moduleEl);
  return ':root {\n' + COLLECTED_VARS.map(v => `${v}: ${computed.getPropertyValue(v).trim()};`).join('\n') + '\n}';
};

const PdfActions = memo(function PdfActions({
  certificateData,
  previewRef,
}: PdfActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [status, setStatus] = useState<ActionStatus>(null);
  const [statusKey, setStatusKey] = useState(0);
  const confirmPreviewRef = useRef<HTMLDivElement | null>(null);
  const printPreviewRef = useRef<HTMLDivElement | null>(null);
  const { downloadPdf, isGenerating } = usePdfGenerator(certificateData, previewRef);

  const showStatus = useCallback((newStatus: ActionStatus) => {
    setStatusKey((k) => k + 1);
    setStatus(newStatus);
  }, []);

  const openDownloadConfirmation = useCallback(() => {
    showStatus(null);
    setIsConfirmOpen(true);
  }, [showStatus]);

  const closeDownloadConfirmation = useCallback(() => {
    if (!isGenerating) {
      setIsConfirmOpen(false);
    }
  }, [isGenerating]);

  const handleConfirmedDownload = useCallback(async () => {
    showStatus(null);

    try {
      const isCompactViewport = window.matchMedia('(max-width: 640px)').matches;
      await downloadPdf(confirmPreviewRef.current, isCompactViewport ? { imageFormat: 'JPEG', imageQuality: 0.92, scale: 1.5 } : undefined);
      setIsConfirmOpen(false);
      showStatus({ message: 'PDF generado correctamente.', type: 'success' });
    } catch (error) {
      showStatus({
        message: error instanceof Error ? error.message : 'No se pudo generar el PDF.',
        type: 'error',
      });
    }
  }, [downloadPdf, showStatus]);

  useEffect(() => {
    if (!isConfirmOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDownloadConfirmation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDownloadConfirmation, isConfirmOpen]);

  const handlePrint = useCallback(() => {
    const source = printPreviewRef.current;
    if (!source) return;

    // ===== PREPARAR EL CONTENIDO =====
    // Clonamos el documento y forzamos propiedades críticas con !important
    // para que los @media print del CSS no lo oculten.
    const clone = source.cloneNode(true) as HTMLElement;

    // Quitar lazy loading para que todas las imágenes se carguen
    clone.querySelectorAll('[loading]').forEach(el => el.removeAttribute('loading'));

    // Forzar propiedades esenciales directamente en el estilo (con !important
    // para vencer cualquier regla del CSS que intente ocultarlo)
    clone.style.setProperty('content-visibility', 'visible', 'important');
    clone.style.setProperty('contain', 'none', 'important');
    clone.style.setProperty('visibility', 'visible', 'important');
    clone.style.setProperty('height', 'auto', 'important');
    clone.style.setProperty('min-height', '11in', 'important');
    clone.style.setProperty('max-height', 'none', 'important');
    clone.style.setProperty('overflow', 'visible', 'important');
    clone.style.setProperty('display', 'flex', 'important');

    // También limpiamos content-visibility de todos los hijos
    clone.querySelectorAll('[style*="content-visibility"]').forEach(el => {
      if (el instanceof HTMLElement) el.style.removeProperty('content-visibility');
    });

    // ===== RECOLECTAR ESTILOS DE LA PÁGINA =====
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    const stylesHtml = Array.from(styles).map(s => s.outerHTML).join('\n');
    const cssVars = collectCssVars();

    // ===== CONSTRUIR HTML PARA NUEVA VENTANA =====
    // Envolvemos el clon en un <div class="certificate-print-source"> para que
    // las reglas @media print existentes (que ocultan body > *) lo muestren.
    const docHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Imprimir documento</title>
        ${stylesHtml}
        <style>
          ${cssVars}
          /* Forzar página vertical tamaño carta */
          @page { size: 8.5in 11in; margin: 0; }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }

          /* Override: forzar que el documento sea visible 
             (contrarresta @media print del CSS que pone visibility: hidden) */
          .certificate-preview-document {
            width: 8.5in;
            min-height: 11in;
            padding: 0.35in;
            margin: 0 auto;
            border: 0;
            box-shadow: none;
            background: #ffffff;
            color: #171411;
            font-family: Georgia, "Times New Roman", serif;
            box-sizing: border-box;
          }

          .certificate-document-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* Anular el @media print del CSS principal que oculta body > * */
          @media print {
            body > * {
              visibility: visible !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
            }
            .certificate-preview-document {
              visibility: visible !important;
              height: auto !important;
              min-height: 11in !important;
              max-height: none !important;
              overflow: visible !important;
              display: flex !important;
              flex-direction: column !important;
              padding: 0.35in !important;
              margin: 0 !important;
              border: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-print-source">
          ${clone.outerHTML}
        </div>
        <script>
          (function() {
            var doc = document.querySelector('.certificate-preview-document');
            if (doc) {
              doc.style.setProperty('content-visibility', 'visible', 'important');
              doc.style.setProperty('contain', 'none', 'important');
            }
            var imgs = document.images;
            var pending = imgs.length;
            function finish() {
              pending--;
              if (pending <= 0) {
                window.focus();
                window.print();
              }
            }
            if (pending === 0) {
              window.focus();
              window.print();
            } else {
              for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].complete) { finish(); }
                else {
                  imgs[i].onload = finish;
                  imgs[i].onerror = finish;
                }
              }
            }
          })();
        <\/script>
      </body>
      </html>
    `;

    // Intentar abrir nueva ventana (popup)
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(docHtml);
      win.document.close();
      return;
    }

    // ===== FALLBACK PARA MÓVIL (popup bloqueado) =====
    // Creamos un overlay a pantalla completa dentro de la misma página
    const printOverlay = document.createElement('div');
    printOverlay.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'z-index:99999',
      'background:#ffffff',
      'display:flex',
      'justify-content:center',
      'align-items:flex-start',
      'print-color-adjust:exact',
      '-webkit-print-color-adjust:exact',
    ].join(';');
    printOverlay.innerHTML = clone.outerHTML;

    // Forzar visibilidad en el overlay
    const overlayDoc = printOverlay.querySelector<HTMLElement>('.certificate-preview-document');
    if (overlayDoc) {
      overlayDoc.style.setProperty('content-visibility', 'visible', 'important');
      overlayDoc.style.setProperty('contain', 'none', 'important');
      overlayDoc.style.setProperty('visibility', 'visible', 'important');
      overlayDoc.style.setProperty('height', 'auto', 'important');
      overlayDoc.style.setProperty('min-height', '11in', 'important');
    }

    // Insertar override print en la página
    const printOverrideEl = document.createElement('style');
    printOverrideEl.textContent = `
      @media print {
        body > * {
          visibility: visible !important;
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
        }
        .certificate-preview-document {
          visibility: visible !important;
          height: auto !important;
          min-height: 11in !important;
          max-height: none !important;
          overflow: visible !important;
          display: flex !important;
          flex-direction: column !important;
          padding: 0.35in !important;
          margin: 0 !important;
          border: 0 !important;
        }
      }
    `;
    document.head.appendChild(printOverrideEl);
    document.body.appendChild(printOverlay);

    // Esperar imágenes y luego imprimir
    const imgs = Array.from(printOverlay.querySelectorAll('img'));
    if (imgs.length === 0) {
      window.print();
    } else {
      let remaining = imgs.length;
      const tryPrint = () => {
        remaining--;
        if (remaining <= 0) { window.print(); }
      };
      imgs.forEach((img) => {
        if (img.complete) { tryPrint(); }
        else {
          img.addEventListener('load', tryPrint, { once: true });
          img.addEventListener('error', tryPrint, { once: true });
        }
      });
    }

    // Limpiar después de imprimir
    const cleanUp = () => {
      if (document.body.contains(printOverlay)) printOverlay.remove();
      if (document.head.contains(printOverrideEl)) printOverrideEl.remove();
    };
    window.addEventListener('afterprint', cleanUp, { once: true });
    setTimeout(cleanUp, 5000);
  }, []);

  return (
    <section className="certificate-actions" aria-label="Acciones del documento">
      <div className="certificate-print-source" aria-hidden="true">
        <CertificatePreview ref={printPreviewRef} data={certificateData} />
      </div>

      <button
        className="certificate-primary-action"
        disabled={isGenerating}
        type="button"
        onClick={openDownloadConfirmation}
      >
        <Download aria-hidden="true" size={18} strokeWidth={2.2} />
        GENERAR DOCUMENTO
      </button>
      <button
        className="certificate-secondary-action"
        disabled={isGenerating}
        type="button"
        onClick={handlePrint}
      >
        <Printer aria-hidden="true" size={17} strokeWidth={2.2} />
        Imprimir
      </button>
      {status ? (
        <p
          key={statusKey}
          className={`certificate-action-status certificate-action-status--${status.type} certificate-action-status--entering`}
        >
          {status.message}
        </p>
      ) : null}

      {isConfirmOpen ? (
        <div className="certificate-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="certificate-confirm-title">
          <div className="certificate-confirm-modal__panel">
            <div className="certificate-confirm-modal__head">
              <div>
                <span>Vista final</span>
                <h2 id="certificate-confirm-title">¿Desea generar y descargar el documento?</h2>
              </div>
              <button
                aria-label="Cancelar generación"
                className="certificate-confirm-modal__close"
                disabled={isGenerating}
                type="button"
                onClick={closeDownloadConfirmation}
              >
                <X aria-hidden="true" size={18} strokeWidth={2.2} />
              </button>
            </div>

            <div className="certificate-confirm-modal__preview" aria-label="Vista previa final del documento">
              <CertificatePreview ref={confirmPreviewRef} data={certificateData} />
            </div>

            <div className="certificate-confirm-modal__actions">
              <button
                className="certificate-secondary-action"
                disabled={isGenerating}
                type="button"
                onClick={closeDownloadConfirmation}
              >
                Cancelar
              </button>
              <button
                className="certificate-primary-action"
                disabled={isGenerating}
                type="button"
                onClick={handleConfirmedDownload}
              >
                <Download aria-hidden="true" size={18} strokeWidth={2.2} />
                {isGenerating ? 'Generando PDF...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

export { PdfActions };
