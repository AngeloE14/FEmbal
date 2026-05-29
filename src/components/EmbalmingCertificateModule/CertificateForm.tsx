import { memo, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import {
  chemicalSolutionFields,
  embalmingTypes,
  type CertificateData,
  type ChemicalSolutionData,
  type ManualCertificateData,
  type ManualCertificateField,
} from './types';
import { SignaturePad } from './SignaturePad';

type CertificateFormProps = {
  data: CertificateData;
  onReset: () => void;
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

const chemicalLabels: Record<keyof ChemicalSolutionData, string> = {
  arterial: 'Arterial',
  formaldehydeConcentration: 'Concentración de formaldehído',
  humectant: 'Humectante',
  jaundiceChemical: 'Químico para ictericia',
  vascularConditioner: 'Acondicionador vascular',
  waterConditioner: 'Acondicionador de agua',
};

export const CertificateForm = memo(function CertificateForm({
  data,
  onReset,
  onUpdate,
}: CertificateFormProps) {
  const handleInputChange = useCallback(
    (field: ManualCertificateField) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        onUpdate(field, event.target.value as never);
      },
    [onUpdate],
  );

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
        type={type}
        value={String(data[field])}
        onChange={handleInputChange(field)}
      />
    </label>
  );

  return (
    <form className="certificate-form" onSubmit={(event) => event.preventDefault()}>
      <div className="certificate-form-heading">
        <strong>EAMS</strong>
        <span>ESCUELA DE ARTES MORTUORIAS DEL SURESTE</span>
      </div>

      <fieldset className="certificate-form-section">
        <legend>SECTION 1: PROCEDIMIENTO DE EMBALSAMAMIENTO</legend>
        {renderTextField({ field: 'funeralHome', label: 'Funeraria o embalsamadora' })}
        <div className="certificate-form-grid">
          {renderTextField({
            field: 'procedureDate',
            label: 'Fecha del procedimiento',
            type: 'date',
          })}
          {renderTextField({
            field: 'procedureTime',
            label: 'Hora del procedimiento',
            type: 'time',
          })}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 2: DATOS DEL FALLECIDO</legend>
        {renderTextField({
          autoComplete: 'name',
          field: 'deceasedName',
          label: 'Nombre de la persona fallecida',
          placeholder: 'Nombre completo del fallecido',
        })}
        <div className="certificate-form-grid">
          {renderTextField({
            field: 'deathCauses',
            label: 'Causas de defunción',
            placeholder: 'Ej. paro cardiorrespiratorio, causa natural...',
          })}
          {renderTextField({
            field: 'doctorName',
            label: 'Médico que certificó la defunción',
            placeholder: 'Nombre completo del médico certificante',
          })}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 3: DATOS LEGALES</legend>
        {renderTextField({
          field: 'doctorLicense',
          label: 'Cédula profesional del médico certificante',
          placeholder: 'Cédula profesional',
        })}
        {renderTextField({
          field: 'deathCertificateFolio',
          label: 'Folio del certificado de defunción',
          placeholder: 'Folio oficial',
        })}
        {renderTextField({
          field: 'injectionSite',
          label: 'Lugar de inyección',
          placeholder: 'Ej. arteria carótida derecha',
        })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 4: TIPO DE EMBALSAMAMIENTO</legend>
        <label className="certificate-field">
          <span>Tipo de embalsamamiento</span>
          <select value={data.embalmingType} onChange={handleInputChange('embalmingType')}>
            {embalmingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 5: SOLUCIÓN QUÍMICA</legend>
        <p className="certificate-sync-note">
          Datos sincronizados automáticamente desde la calculadora arterial activa.
        </p>
        <div className="certificate-form-grid">
          {chemicalSolutionFields.map(renderSyncedChemicalField)}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 6: RECOMENDACIONES DE TRASLADO</legend>
        <label className="certificate-field">
          <span>Recomendaciones de traslado</span>
          <textarea
            rows={6}
            value={data.transferRecommendations}
            onChange={handleInputChange('transferRecommendations')}
          />
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 7: INFORMACIÓN DEL EMBALSAMADOR</legend>
        {renderTextField({ autoComplete: 'name', field: 'embalmerName', label: 'Nombre del embalsamador' })}
        {renderTextField({ field: 'embalmerLicense', label: 'Cédula profesional' })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>SECTION 8: FIRMA Y GENERACIÓN</legend>
        <SignaturePad onSignatureChange={(signatureDataUrl) => onUpdate('signatureDataUrl', signatureDataUrl)} />
      </fieldset>

      <button className="certificate-reset-action" type="button" onClick={onReset}>
        Reiniciar formulario
      </button>
    </form>
  );
});
