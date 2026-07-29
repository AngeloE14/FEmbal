// ===== MÓDULO DE DOCUMENTO (VISTA PREVIA) =====
// Esta vista es la plantilla visual que se convierte en PDF.
// - Cada sección usa UNA SOLA COLUMNA (ya no 2) para que los campos
//   tengan más espacio horizontal (respiración).
// - Si quitamos un campo aquí, también desaparece del archivo generado.
// - forwardRef permite que el módulo de PDF acceda al elemento HTML
//   para capturarlo con html2canvas.

import { forwardRef, memo, useMemo } from 'react';
import type { CertificateData } from './types';
import { useI18n } from '../../hooks/useI18n';
import { assetUrl } from '../../utils/paths';

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
    const { t } = useI18n();

    const sections = useMemo<PreviewBlock[]>(
      () => [
        {
          rows: [
            { label: t('certificate.form.funeralHome'), value: data.funeralHome },
            { label: t('certificate.form.date'), value: formatDate(data.procedureDate) },
            { label: t('certificate.form.time'), value: data.procedureTime },
          ],
          title: t('certificate.form.section.procedure'),
        },
        {
          rows: [
            { label: t('certificate.form.deceasedName'), value: data.deceasedName },
            { label: t('certificate.form.deathCauses'), value: data.deathCauses },
            { label: t('certificate.form.folio'), value: data.deathCertificateFolio },
          ],
          title: t('certificate.form.section.deceased'),
        },
        {
          rows: [
            { label: t('certificate.form.injectionSite'), value: data.injectionSite },
            { label: t('certificate.form.embalmingType'), value: data.embalmingType },
          ],
          title: t('certificate.form.section.procedure.detail'),
        },
        {
          rows: [
            { label: t('certificate.chem.fa'), value: data.formaldehydeConcentration },
            { label: t('certificate.chem.arterial'), value: data.arterial },
            { label: t('certificate.chem.water'), value: data.waterConditioner },
          ],
          title: t('certificate.form.section.chemical'),
        },
        {
          rows: [{ label: t('certificate.form.transfer'), value: data.transferRecommendations }],
          title: t('certificate.form.section.transfer'),
        },
        {
          rows: [
            { label: t('certificate.form.doctorName'), value: data.doctorName },
            { label: t('certificate.form.doctorLicense'), value: data.doctorLicense },
            { label: t('certificate.form.embalmerName'), value: data.embalmerName },
            { label: t('certificate.form.embalmerLabel'), value: data.embalmerLicense },
          ],
          title: t('certificate.form.section.doctor'),
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
        data.injectionSite,
        data.procedureDate,
        data.procedureTime,
        data.transferRecommendations,
        data.waterConditioner,
        t,
      ],
    );

    return (
      <article className="certificate-preview-document" ref={ref}>
        <header className="certificate-document-header">
          <img
            alt=""
            className="certificate-document-logo"
            src={assetUrl('/assets/images/logo-circular.png')}
            loading="lazy"
            decoding="async"
          />
          <div>
            <p>ESAMS</p>
            <h1>{t('certificate.doc.title')}</h1>
          </div>
        </header>

        <div className="certificate-document-meta">
          <span className="certificate-document-meta-brand">
            <img alt="" src={assetUrl('/assets/images/logo-circular.png')} loading="lazy" decoding="async" />
            {t('certificate.doc.generated')}
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
              <img alt={t('certificate.doc.signature')} src={data.signatureDataUrl} />
            ) : (
              <span>{emptyValue}</span>
            )}
            <strong>{t('certificate.doc.signature')}</strong>
          </div>
        </footer>
      </article>
    );
  },
);

export const CertificatePreview = memo(CertificatePreviewBase);
