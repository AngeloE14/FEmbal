// ===== MÓDULO DE DOCUMENTO =====
// Este hook copia al documento los datos calculados por la calculadora.
// Lo hacemos aquí para que el formulario no tenga que repetir fórmulas químicas.

import { useMemo } from 'react';
import { useCalculatorForm, useCalculatorResults } from '../../../hooks/useCalculator';
import { formatMlAndOz, formatNumber } from '../../../utils/formatters';
import {
  emptyChemicalSolutionData,
  type CertificateData,
  type ChemicalSolutionData,
  type ManualCertificateData,
} from '../types';

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

    // Solo extraemos los valores que sí se deben mostrar. Los campos retirados
    // no se calculan aquí para que no puedan reaparecer en el documento.
    const {
      arterialMl = 0,
      baseObjective = 0,
      concentrado = 0,
      finalTarget = 0,
      waterMl = 0,
    } = currentRecommendation;

    const chemicalLabel = selectedChemical?.label ?? 'Fluido arterial concentrado';

    return {
      formaldehydeConcentration: `Botella ${formatNumber(concentrado, 2)}% | Objetivo base ${formatNumber(baseObjective, 2)}% | Final ${formatNumber(finalTarget, 2)}%`,
      arterial: `${formatMlAndOz(arterialMl, 1, 1)} de ${chemicalLabel}`,
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
