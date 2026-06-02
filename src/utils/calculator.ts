/**
 * Motor puro de recomendaciones.
 * Calcula la dilución C1·V1 = C2·V2 para formular solución arterial.
 */

import {
  GALLONS_PER_KG,
  MAX_SAFE_TARGET,
  MIN_SAFE_TARGET,
  ML_PER_GALLON,
  type CaseData,
  type RecommendationResult,
} from './constants';
import { formatNumber } from './formatters';

export function buildCaseSignature(caseData: CaseData): string {
  return [
    caseData.concentrado ?? '',
    caseData.objetivoManual ?? '',
    caseData.peso ?? '',
    caseData.volumenPrepararLitros ?? '',
  ].join('|');
}

export function validateCaseData(caseData: CaseData): string {
  if (caseData.concentrado === null || (caseData.peso === null && caseData.volumenPrepararLitros === null)) {
    return 'Ingresa el concentrado y al menos peso o volumen final para calcular.';
  }

  if (Number.isNaN(caseData.concentrado) || caseData.concentrado <= 0) {
    return 'Ingresa un concentrado valido mayor a cero.';
  }

  if (caseData.peso !== null && (Number.isNaN(caseData.peso) || caseData.peso <= 0)) {
    return 'Ingresa un peso valido mayor a cero.';
  }

  if (
    caseData.volumenPrepararLitros !== null &&
    (Number.isNaN(caseData.volumenPrepararLitros) || caseData.volumenPrepararLitros <= 0)
  ) {
    return 'Ingresa un volumen final valido mayor a cero.';
  }

  if (caseData.objetivoManual !== null && (Number.isNaN(caseData.objetivoManual) || caseData.objetivoManual <= 0)) {
    return 'La concentracion base manual debe ser mayor a cero.';
  }

  if (caseData.peso !== null && caseData.peso > 227) {
    return 'El peso debe estar en un rango razonable para este calculador (hasta 227 kg).';
  }

  if (caseData.volumenPrepararLitros !== null && caseData.volumenPrepararLitros > 30.28) {
    return 'El volumen final debe estar en un rango razonable para este calculador (hasta 30.28 L).';
  }

  return '';
}

export function buildRecommendation(caseData: CaseData): RecommendationResult {
  const baseObjective = caseData.objetivoManual !== null ? caseData.objetivoManual : 2.25;

  const hasManualVolume = caseData.volumenPrepararLitros !== null;
  const volumeBaseGallons = hasManualVolume
    ? (caseData.volumenPrepararLitros as number) / 3.78541
    : (caseData.peso as number) * GALLONS_PER_KG;
  const finalVolumeGallons = Math.max(0.1, Math.min(8, volumeBaseGallons));
  const totalSolutionMl = finalVolumeGallons * ML_PER_GALLON;

  let finalTarget = baseObjective;

  if (finalTarget < MIN_SAFE_TARGET) {
    finalTarget = MIN_SAFE_TARGET;
  }

  if (finalTarget > MAX_SAFE_TARGET) {
    finalTarget = MAX_SAFE_TARGET;
  }

  if ((caseData.concentrado as number) <= finalTarget) {
    return {
      ok: false,
      error: 'La concentracion final recomendada no puede ser igual o mayor que la concentracion del arterial en botella.',
    };
  }

  const arterialMl = (finalTarget * totalSolutionMl) / (caseData.concentrado as number);
  const waterMl = totalSolutionMl - arterialMl;

  if (waterMl < 0) {
    return {
      ok: false,
      error: 'El volumen de agua resulto negativo; revisa los datos de entrada.',
    };
  }

  return {
    ok: true,
    concentrado: caseData.concentrado as number,
    baseObjective,
    finalTarget,
    volumeBaseGallons,
    finalVolumeGallons,
    totalSolutionMl,
    arterialMl,
    waterMl,
    formulaVolume: hasManualVolume
      ? `Volumen final indicado: ${formatNumber(caseData.volumenPrepararLitros as number, 2)} L = ${formatNumber(totalSolutionMl, 0)} ml.`
      : `Volumen base: ${formatNumber(caseData.peso as number, 0)} kg x ${formatNumber(GALLONS_PER_KG, 4)} = ${formatNumber(volumeBaseGallons, 2)} gal.`,
    formulaConcentration: `Concentracion final: ${formatNumber(baseObjective, 2)}%`,
    formulaFinal: `Arterial: (${formatNumber(finalTarget, 2)} x ${formatNumber(totalSolutionMl, 0)} ml) / ${formatNumber(caseData.concentrado as number, 2)} = ${formatNumber(arterialMl, 1)} ml. Agua exacta: ${formatNumber(totalSolutionMl, 0)} - ${formatNumber(arterialMl, 1)} = ${formatNumber(waterMl, 1)} ml.`,
  };
}


