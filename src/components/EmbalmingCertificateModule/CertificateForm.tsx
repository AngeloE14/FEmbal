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

// El formulario mantiene solo los campos que el usuario debe capturar.
// Los textos se dejaron sencillos porque este documento es interno del sistema,
// no un formato oficial ni una constancia institucional.
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
  jaundiceChemical: 'Químico para ictericia',
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

  // Los campos químicos son de solo lectura porque vienen de la calculadora.
  // Así evitamos que una persona cambie aquí datos que ya fueron calculados.
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

  // Helper pequeño para que todos los inputs tengan el mismo diseño y validación.
  // Esto hace que el formulario sea más fácil de mantener para el equipo.
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
        <legend>Procedimiento</legend>
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
        <legend>Datos del fallecido</legend>
        {renderTextField({
          autoComplete: 'name',
          field: 'deceasedName',
          label: 'Nombre de la persona fallecida',
          placeholder: 'Nombre completo del fallecido',
        })}
        {renderTextField({
          field: 'deathCauses',
          label: 'Causas de defunción',
          placeholder: 'Ej. paro cardiorrespiratorio, causa natural...',
        })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Datos del procedimiento</legend>
        <label className="certificate-field">
          <span>Lugar de inyección</span>
          <input
            placeholder="Ej. arteria carótida derecha"
            required
            type="text"
            value={data.injectionSite}
            onChange={handleInputChange('injectionSite')}
          />
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Tipo de embalsamamiento</legend>
        <label className="certificate-field">
          <span>Tipo de embalsamamiento</span>
          <select required value={data.embalmingType} onChange={handleInputChange('embalmingType')}>
            {embalmingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Solución química</legend>
        <p className="certificate-sync-note">
          Datos sincronizados automáticamente desde la calculadora arterial activa.
        </p>
        <div className="certificate-form-grid">
          {chemicalSolutionFields.map(renderSyncedChemicalField)}
        </div>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Recomendaciones de traslado</legend>
        <label className="certificate-field">
          <span>Recomendaciones de traslado</span>
          <textarea
            required
            rows={6}
            value={data.transferRecommendations}
            onChange={handleInputChange('transferRecommendations')}
          />
        </label>
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Médico y embalsamador</legend>
        {renderTextField({
          field: 'doctorName',
          label: 'Médico que indicó la defunción',
          placeholder: 'Nombre completo del médico certificante',
        })}
        {renderTextField({
          field: 'doctorLicense',
          label: 'Cédula profesional del médico certificante',
          placeholder: 'Cédula profesional',
        })}
        {renderTextField({ autoComplete: 'name', field: 'embalmerName', label: 'Nombre del embalsamador' })}
        {renderTextField({ field: 'embalmerLicense', label: 'Cédula profesional' })}
      </fieldset>

      <fieldset className="certificate-form-section">
        <legend>Firma</legend>
        <SignaturePad onSignatureChange={(signatureDataUrl) => onUpdate('signatureDataUrl', signatureDataUrl)} />
      </fieldset>

      <button className="certificate-reset-action" type="button" onClick={onReset}>
        Reiniciar formulario
      </button>
    </form>
  );
});
