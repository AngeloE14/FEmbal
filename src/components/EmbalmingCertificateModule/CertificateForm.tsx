import { memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useI18n } from '../../hooks/useI18n';
import {
  chemicalSolutionFields,
  type CertificateData,
  type ChemicalSolutionData,
  type ManualCertificateData,
  type ManualCertificateField,
} from './types';
import { SignaturePad } from './SignaturePad';

type CertificateFormProps = {
  data: CertificateData;
  onUpdate: <Field extends ManualCertificateField>(
    field: Field,
    value: ManualCertificateData[Field],
  ) => void;
};

type TextFieldProps = {
  autoComplete?: string;
  field: ManualCertificateField;
  label: string;
  placeholder?: string;
  type?: 'date' | 'email' | 'text' | 'time';
};

export const CertificateForm = memo(function CertificateForm({
  data,
  onUpdate,
}: CertificateFormProps) {
  const { t } = useI18n();

  const handleInputChange = useCallback(
    (field: ManualCertificateField) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onUpdate(field, event.target.value as never);
      },
    [onUpdate],
  );

  const chemicalLabels: Record<keyof ChemicalSolutionData, string> = {
    arterial: t('certificate.chem.arterial'),
    formaldehydeConcentration: t('certificate.chem.fa'),
    waterConditioner: t('certificate.chem.water'),
  };

  const renderSyncedChemicalField = (field: keyof ChemicalSolutionData) => (
    <label className="certificate-field certificate-field--synced" key={field}>
      <span>{chemicalLabels[field]}</span>
      <textarea
        readOnly
        rows={2}
        value={String(data[field])}
      />
    </label>
  );

  const renderTextField = ({ autoComplete, field, label, placeholder, type = 'text' }: TextFieldProps) => (
    <label className="certificate-field" key={field}>
      <span>{label}</span>
      <input
        autoComplete={autoComplete}
        inputMode={type === 'text' ? 'text' : undefined}
        placeholder={placeholder}
        required
        type={type}
        value={String(data[field])}
        onChange={handleInputChange(field)}
      />
    </label>
  );

  return (
    <form className="certificate-form" onSubmit={(event) => event.preventDefault()}>
      <div className="certificate-form-heading">
        <strong>ESAMS</strong>
      </div>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.procedure')}</legend>
        {renderTextField({ field: 'funeralHome', label: t('certificate.form.funeralHome') })}
        <div className="certificate-form-grid">
          {renderTextField({
            field: 'procedureDate',
            label: t('certificate.form.date'),
            type: 'date',
          })}
          {renderTextField({
            field: 'procedureTime',
            label: t('certificate.form.time'),
            type: 'time',
          })}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.deceased')}</legend>
        {renderTextField({
          autoComplete: 'name',
          field: 'deceasedName',
          label: t('certificate.form.deceasedName'),
          placeholder: t('certificate.form.deceasedName.placeholder'),
        })}
        {renderTextField({
          field: 'deathCauses',
          label: t('certificate.form.deathCauses'),
          placeholder: t('certificate.form.deathCauses.placeholder'),
        })}
        {renderTextField({
          field: 'deathCertificateFolio',
          label: t('certificate.form.folio'),
          placeholder: t('certificate.form.folio.placeholder'),
        })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.procedure.detail')}</legend>
        <label className="certificate-field">
          <span>{t('certificate.form.injectionSite')}</span>
          <input
            placeholder={t('certificate.form.injectionSite.placeholder')}
            required
            type="text"
            value={data.injectionSite}
            onChange={handleInputChange('injectionSite')}
          />
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.type')}</legend>
        <label className="certificate-field">
          <span>{t('certificate.form.embalmingType')}</span>
          <select required value={data.embalmingType} onChange={handleInputChange('embalmingType')}>
            <option value="Patológico">{t('certificate.type.pathological')}</option>
            <option value="Caso Legal">{t('certificate.type.legal')}</option>
            <option value="Traslado">{t('certificate.type.transfer')}</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.chemical')}</legend>
        <p className="certificate-sync-note">
          {t('certificate.form.syncNote')}
        </p>
        <div className="certificate-form-grid">
          {chemicalSolutionFields.map(renderSyncedChemicalField)}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.transfer')}</legend>
        <label className="certificate-field">
          <span>{t('certificate.form.transfer')}</span>
          <textarea
            required
            rows={6}
            value={data.transferRecommendations}
            onChange={handleInputChange('transferRecommendations')}
          />
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.doctor')}</legend>
        {renderTextField({
          field: 'doctorName',
          label: t('certificate.form.doctorName'),
          placeholder: t('certificate.form.doctorName.placeholder'),
        })}
        {renderTextField({
          field: 'doctorLicense',
          label: t('certificate.form.doctorLicense'),
          placeholder: t('certificate.form.doctorLicense.placeholder'),
        })}
        {renderTextField({ autoComplete: 'name', field: 'embalmerName', label: t('certificate.form.embalmerName') })}
        {renderTextField({ field: 'embalmerLicense', label: t('certificate.form.embalmerLabel') })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>{t('certificate.form.section.signature')}</legend>
        <SignaturePad onSignatureChange={(signatureDataUrl) => onUpdate('signatureDataUrl', signatureDataUrl)} />
      </fieldset>
    </form>
  );
});
