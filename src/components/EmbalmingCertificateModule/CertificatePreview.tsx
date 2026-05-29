// ===== MÓDULO DE DOCUMENTO =====
// Esta vista es la plantilla visual que se convierte en PDF.
// Si quitamos un campo aquí, también desaparece del archivo generado.

import { forwardRef, memo, useMemo } from 'react';
import type { CertificateData } from './types';

type CertificatePreviewProps = {
  data: CertificateData;
};

type PreviewRow = {
  label: string;
  value: string;
};

type PreviewBlock = {
  rows: PreviewRow[];
  title: string;
};

const emptyValue = '____________________________';

// Convertimos la fecha de YYYY-MM-DD a DD/MM/YYYY para que sea más legible.
const formatDate = (value: string) => {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const getValue = (value: string) => value.trim() || emptyValue;

// Cada fila imprime una etiqueta y su valor. Si el valor está vacío, se muestra
// una línea para que la vista no se rompa visualmente.
const CertificateDocumentRow = memo(function CertificateDocumentRow({ label, value }: PreviewRow) {
  return (
    <div className="certificate-document-row">
      <dt>{label}</dt>
      <dd>{getValue(value)}</dd>
    </div>
  );
});

const CertificateDocumentBlock = memo(function CertificateDocumentBlock({
  rows,
  title,
}: PreviewBlock) {
  return (
    <section className="certificate-document-section">
      <h2>{title}</h2>
      <dl>
        {rows.map((row) => (
          <CertificateDocumentRow
            key={`${title}-${row.label}`}
            label={row.label}
            value={row.value}
          />
        ))}
      </dl>
    </section>
  );
});

const CertificatePreviewBase = forwardRef<HTMLDivElement, CertificatePreviewProps>(
  function CertificatePreview({ data }, ref) {
    // Aquí definimos exactamente qué campos salen en el documento.
    // Por eso no incluimos los campos que el equipo pidió retirar:
    // si no están en esta lista, no salen en la salida final.
    const sections = useMemo<PreviewBlock[]>(
      () => [
        {
          rows: [
            { label: 'Funeraria o embalsamadora', value: data.funeralHome },
            { label: 'Fecha del procedimiento', value: formatDate(data.procedureDate) },
            { label: 'Hora del procedimiento', value: data.procedureTime },
          ],
          title: 'Procedimiento',
        },
        {
          rows: [
            { label: 'Nombre de la persona fallecida', value: data.deceasedName },
            { label: 'Causas de defunción', value: data.deathCauses },
          ],
          title: 'Datos del fallecido',
        },
        {
          rows: [
            { label: 'Lugar de inyección', value: data.injectionSite },
          ],
          title: 'Datos del procedimiento',
        },
        {
          rows: [{ label: 'Tipo de embalsamamiento', value: data.embalmingType }],
          title: 'Tipo de embalsamamiento',
        },
        {
          rows: [
            { label: 'Concentración de formaldehído', value: data.formaldehydeConcentration },
            { label: 'Arterial', value: data.arterial },
            { label: 'Químico para ictericia', value: data.jaundiceChemical },
            { label: 'Acondicionador de agua', value: data.waterConditioner },
          ],
          title: 'Solución química',
        },
        {
          rows: [{ label: 'Recomendaciones de traslado', value: data.transferRecommendations }],
          title: 'Recomendaciones de traslado',
        },
        {
          rows: [
            { label: 'Médico que indicó la defunción', value: data.doctorName },
            { label: 'Cédula profesional del médico certificante', value: data.doctorLicense },
            { label: 'Nombre del embalsamador', value: data.embalmerName },
            { label: 'Cédula profesional', value: data.embalmerLicense },
          ],
          title: 'Médico y embalsamador',
        },
      ],
      [
        data.arterial,
        data.deathCauses,
        data.deceasedName,
        data.doctorLicense,
        data.doctorName,
        data.embalmerLicense,
        data.embalmerName,
        data.embalmingType,
        data.formaldehydeConcentration,
        data.funeralHome,
        data.injectionSite,
        data.jaundiceChemical,
        data.procedureDate,
        data.procedureTime,
        data.transferRecommendations,
        data.waterConditioner,
      ],
    );

    return (
      <article className="certificate-preview-document" ref={ref}>
        <header className="certificate-document-header">
          <img
            alt=""
            className="certificate-document-logo"
            src="/assets/images/logo-circular.png"
            loading="lazy"
            decoding="async"
          />
          <div>
            <p>ESAMS</p>
          </div>
        </header>

        <div className="certificate-document-meta">
          <span className="certificate-document-meta-brand">
            <img alt="" src="/assets/images/logo-circular.png" loading="lazy" decoding="async" />
            Documento generado a través del sistema
          </span>
        </div>

        <div className="certificate-document-body">
          {sections.map((section) => (
            <CertificateDocumentBlock
              key={section.title}
              rows={section.rows}
              title={section.title}
            />
          ))}
        </div>

        <footer className="certificate-document-footer">
          <div className="certificate-signature-preview">
            {data.signatureDataUrl ? (
              <img alt="Firma digital del embalsamador" src={data.signatureDataUrl} />
            ) : (
              <span>{emptyValue}</span>
            )}
            <strong>Firma del embalsamador</strong>
          </div>
        </footer>
      </article>
    );
  },
);

export const CertificatePreview = memo(CertificatePreviewBase);
