// ===== CERTIFICATE MODULE =====
// Sincroniza el certificado con los resultados reales de la calculadora.
// No recalcula la mezcla: consume currentRecommendation, inputs y químico elegido.

import { useMemo } from 'react';
import { useCalculatorForm, useCalculatorResults } from '../../../hooks/useCalculator';
import { formatMlAndOz, formatNumber } from '../../../utils/formatters';
import {
  emptyChemicalSolutionData,
  type CertificateData,
  type ChemicalSolutionData,
  type ManualCertificateData,
} from '../types';

const noSystemValue = 'Sin dato calculado en el sistema actual.';

export function useCertificateSync(manualData: ManualCertificateData): CertificateData {
  const { inputs, selectedChemical } = useCalculatorForm();
  const { currentRecommendation } = useCalculatorResults();

  const chemicalSolution = useMemo<ChemicalSolutionData>(() => {
    if (!currentRecommendation?.ok) {
      const concentrado = inputs.concentrado.trim();

      return {
        ...emptyChemicalSolutionData,
        formaldehydeConcentration: concentrado
          ? `Concentración en botella capturada: ${concentrado}%`
          : emptyChemicalSolutionData.formaldehydeConcentration,
      };
    }

    const {
      alerts,
      arterialMl = 0,
      baseObjective = 0,
      concentrado = 0,
      finalTarget = 0,
      waterMl = 0,
    } = currentRecommendation;

    const chemicalLabel = selectedChemical?.label ?? 'Fluido arterial concentrado';
    const jaundiceAlert = alerts.find((alert) => alert.toLowerCase().includes('ictericia'));

    return {
      formaldehydeConcentration: `Botella ${formatNumber(concentrado, 2)}% | Objetivo base ${formatNumber(baseObjective, 2)}% | Final ${formatNumber(finalTarget, 2)}%`,
      arterial: `${formatMlAndOz(arterialMl, 1, 1)} de ${chemicalLabel}`,
      vascularConditioner: noSystemValue,
      humectant: noSystemValue,
      jaundiceChemical: jaundiceAlert ?? 'Sin indicación automática del cálculo actual.',
      waterConditioner: `Agua exacta calculada: ${formatMlAndOz(waterMl, 1, 1)}`,
    };
  }, [currentRecommendation, inputs.concentrado, selectedChemical]);

  return useMemo(
    () => ({
      ...manualData,
      ...chemicalSolution,
    }),
    [chemicalSolution, manualData],
  );
}
