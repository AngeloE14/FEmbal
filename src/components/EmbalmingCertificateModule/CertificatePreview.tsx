// ===== CERTIFICATE MODULE =====
// Preview HTML carta. El PDF se genera sólo bajo demanda desde este DOM,
// así la escritura en el formulario no dispara trabajo pesado.

import { forwardRef, memo, useMemo } from 'react';
import type { CertificateData } from './types';

type CertificatePreviewProps = {
  data: CertificateData;
};

type PreviewRow = {
  label: string;
  value: string;
};

type PreviewSection = {
  rows: PreviewRow[];
  title: string;
};

const emptyValue = '____________________________';

const formatDate = (value: string) => {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const getValue = (value: string) => value.trim() || emptyValue;

const CertificateDocumentRow = memo(function CertificateDocumentRow({ label, value }: PreviewRow) {
  return (
    <div className="certificate-document-row">
      <dt>{label}</dt>
      <dd>{getValue(value)}</dd>
    </div>
  );
});

const CertificateDocumentSection = memo(function CertificateDocumentSection({
  rows,
  title,
}: PreviewSection) {
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
    const sections = useMemo<PreviewSection[]>(
      () => [
        {
          rows: [
            { label: 'Funeraria o embalsamadora', value: data.funeralHome },
            { label: 'Fecha del procedimiento', value: formatDate(data.procedureDate) },
            { label: 'Hora del procedimiento', value: data.procedureTime },
          ],
          title: 'SECTION 1: PROCEDIMIENTO DE EMBALSAMAMIENTO',
        },
        {
          rows: [
            { label: 'Nombre de la persona fallecida', value: data.deceasedName },
            { label: 'Causas de defunción', value: data.deathCauses },
            { label: 'Médico que certificó la defunción', value: data.doctorName },
          ],
          title: 'SECTION 2: DATOS DEL FALLECIDO',
        },
        {
          rows: [
            { label: 'Cédula profesional del médico certificante', value: data.doctorLicense },
            { label: 'Folio del certificado de defunción', value: data.deathCertificateFolio },
            { label: 'Lugar de inyección', value: data.injectionSite },
          ],
          title: 'SECTION 3: DATOS LEGALES',
        },
        {
          rows: [{ label: 'Tipo de embalsamamiento', value: data.embalmingType }],
          title: 'SECTION 4: TIPO DE EMBALSAMAMIENTO',
        },
        {
          rows: [
            { label: 'Concentración de formaldehído', value: data.formaldehydeConcentration },
            { label: 'Arterial', value: data.arterial },
            { label: 'Acondicionador vascular', value: data.vascularConditioner },
            { label: 'Humectante', value: data.humectant },
            { label: 'Químico para ictericia', value: data.jaundiceChemical },
            { label: 'Acondicionador de agua', value: data.waterConditioner },
          ],
          title: 'SECTION 5: SOLUCIÓN QUÍMICA',
        },
        {
          rows: [{ label: 'Recomendaciones de traslado', value: data.transferRecommendations }],
          title: 'SECTION 6: RECOMENDACIONES DE TRASLADO',
        },
        {
          rows: [
            { label: 'Nombre del embalsamador', value: data.embalmerName },
            { label: 'Cédula profesional', value: data.embalmerLicense },
          ],
          title: 'SECTION 7: INFORMACIÓN DEL EMBALSAMADOR',
        },
      ],
      [
        data.arterial,
        data.deathCauses,
        data.deathCertificateFolio,
        data.deceasedName,
        data.doctorLicense,
        data.doctorName,
        data.embalmerLicense,
        data.embalmerName,
        data.embalmingType,
        data.formaldehydeConcentration,
        data.funeralHome,
        data.humectant,
        data.injectionSite,
        data.jaundiceChemical,
        data.procedureDate,
        data.procedureTime,
        data.transferRecommendations,
        data.vascularConditioner,
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
          />
          <div>
            <p>EAMS</p>
            <h1>ESCUELA DE ARTES MORTUORIAS DEL SURESTE</h1>
            <span>Certificado de Embalsamamiento</span>
          </div>
        </header>

        <div className="certificate-document-meta">
          <span>Documento profesional</span>
          <span>Formato carta</span>
        </div>

        <div className="certificate-document-body">
          {sections.map((section) => (
            <CertificateDocumentSection
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
          <div className="certificate-footer-note">
            <strong>SECTION 8: FIRMA Y GENERACIÓN</strong>
            <span>Este documento refleja la información capturada para generación, impresión y envío.</span>
          </div>
        </footer>
      </article>
    );
  },
);

export const CertificatePreview = memo(CertificatePreviewBase);
