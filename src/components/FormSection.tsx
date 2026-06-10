/**
 * Formulario principal controlado por React.
 * Origen: bloque de formulario del index.html original.
 *
 * NOTA: Se eliminó la sincronización del formulario con el hash de la URL
 * (history.replaceState + lectura inicial desde window.location.hash)
 * para evitar que la URL cambie al hacer cálculos.
 * También se eliminó el atributo crossorigin de los assets del build
 * para prevenir que Chrome en escritorio rechace la aplicación del CSS.
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/components/FormSection.css';
import { useCalculatorForm } from '../hooks/useCalculator';
import { useI18n } from '../hooks/useI18n';
import { parseInputNumber } from '../utils/formatters';
import { CHEMICAL_OPTIONS, PRESET_BUTTONS } from '../utils/profiles';

export const FormSection = memo(function FormSection() {
  const { t } = useI18n();
  const {
    inputs,
    selectedChemical,
    isConcentradoLocked,
    updateInput,
    selectChemical,
    clearChemicalSelection,
    applyPreset,
  } = useCalculatorForm();

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRootRef = useRef<HTMLDivElement | null>(null);
  const chemicalListId = 'comboConcentradoList';
  const selectedChemicalLabel = selectedChemical?.label ?? t('form.select.default');
  const objectiveValue = useMemo(() => parseInputNumber(inputs.objetivoManual), [inputs.objetivoManual]);

  // Cierra el combo cuando se pulsa fuera, para mantener UX táctil clara.
  useEffect(() => {
    const handleDocumentPointerDown = (event: globalThis.PointerEvent) => {
      if (!selectRootRef.current?.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown, { passive: true });
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown);
  }, []);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSelectOpen(false);
      }
    };

    if (isSelectOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isSelectOpen]);

  const isPresetButtonActive = (min?: number, max?: number) => {
    if (objectiveValue === null) {
      return false;
    }
    if (min !== undefined && objectiveValue < min) {
      return false;
    }
    if (max !== undefined && objectiveValue > max) {
      return false;
    }
    return min !== undefined || max !== undefined;
  };

  return (
    <article className="box tarjeta-interactiva">
      <div className="field">
        <label htmlFor="concentrado">{t('form.concentrado.label')}</label>
        <input
          id="concentrado"
          type="number"
          min="0.1"
          step="0.1"
          placeholder={t('form.concentrado.placeholder')}
          autoComplete="off"
          inputMode="decimal"
          value={inputs.concentrado}
          readOnly={isConcentradoLocked}
          onChange={(event) => updateInput('concentrado', event.target.value)}
          onFocus={() => {
            if (isConcentradoLocked) {
              clearChemicalSelection();
            }
          }}
          onPointerDown={() => {
            if (isConcentradoLocked) {
              clearChemicalSelection();
            }
          }}
        />

        <label htmlFor="comboConcentrado" className="combo-label">
          {t('form.select.label')}
        </label>

        <div
          className="custom-select"
          id="comboConcentrado"
          ref={selectRootRef}
        >
          <button
            className="select-selected"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isSelectOpen}
            aria-controls={chemicalListId}
            onClick={() => setIsSelectOpen((previous) => !previous)}
          >
            {selectedChemicalLabel}
          </button>
          <div className={`select-items ${isSelectOpen ? '' : 'select-hide'}`} id={chemicalListId} role="listbox">
            {CHEMICAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                className="select-item"
                type="button"
                role="option"
                aria-selected={selectedChemical?.value === option.value}
                data-value={option.value}
                onClick={() => {
                  selectChemical(option);
                  setIsSelectOpen(false);
                }}
              >
                <span>{t(`chemical.option.${option.value}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

        <div className="form-grid">
        <div className="field">
          <label htmlFor="peso">{t('form.peso.label')}</label>
          <input
            id="peso"
            type="number"
            min="1"
            step="1"
            placeholder={t('form.peso.placeholder')}
            autoComplete="off"
            inputMode="decimal"
            value={inputs.peso}
            onChange={(event) => updateInput('peso', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="volumenPreparar">{t('form.volumen.label')}</label>
          <input
            id="volumenPreparar"
            type="number"
            min="0.1"
            step="0.1"
            placeholder={t('form.volumen.placeholder')}
            autoComplete="off"
            inputMode="decimal"
            value={inputs.volumenPrepararLitros}
            onChange={(event) => updateInput('volumenPrepararLitros', event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="objetivo">{t('form.objetivo.label')}</label>
        <input
          id="objetivo"
          type="number"
          min="0.1"
          step="0.1"
          placeholder={t('form.objetivo.placeholder')}
          autoComplete="off"
          inputMode="decimal"
          value={inputs.objetivoManual}
          onChange={(event) => updateInput('objetivoManual', event.target.value)}
        />
      </div>

      <div className="presets" aria-label={t('form.presets.aria')}>
        {PRESET_BUTTONS.map((preset) => (
          <button
            key={preset.key}
            className={`chip ${isPresetButtonActive(preset.min, preset.max) ? 'chip--active' : ''}`}
            type="button"
            data-preset={preset.key}
            data-min={preset.min}
            data-max={preset.max}
            data-set={preset.set}
            aria-pressed={isPresetButtonActive(preset.min, preset.max)}
            onClick={() => applyPreset(preset.set)}
          >
            {t(`form.preset.${preset.key}`)}
          </button>
        ))}
      </div>

      <p className="auto-hint" role="status">
        {t('form.realtime')}
      </p>
      <p className="notes">
        {t('form.base.note')}
      </p>
    </article>
  );
});
