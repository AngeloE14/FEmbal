/**
 * Barra visual de proporciones arterial/agua.
 * Usa transformaciones (`scaleX`) para animar con costo bajo en GPU.
 */

import { memo } from 'react';
import '../styles/components/MixProgress.css';
import { useI18n } from '../hooks/useI18n';
import { formatNumber } from '../utils/formatters';

interface MixProgressProps {
  arterialMl: number;
  waterMl: number;
  totalSolutionMl: number;
}

export const MixProgress = memo(function MixProgress({ arterialMl, waterMl, totalSolutionMl }: MixProgressProps) {
  const { t } = useI18n();
  const arterialPct = totalSolutionMl > 0 ? (arterialMl / totalSolutionMl) * 100 : 0;
  const waterPct = totalSolutionMl > 0 ? (waterMl / totalSolutionMl) * 100 : 0;

  return (
    <div className="mix-progress bloque-mezcla" aria-live="polite">
      <div className="mix-progress__head">
        <span id="mixChemicalPct">{t('mix.arterial', formatNumber(arterialPct, 1))}</span>
        <span id="mixWaterPct">{t('mix.water', formatNumber(waterPct, 1))}</span>
      </div>

      <div className="mix-progress__track" role="img" aria-label={t('mix.aria')}>
        <div
          className="mix-progress__bar mix-progress__bar--chemical"
          id="mixChemicalBar"
          style={{ transform: `scaleX(${(arterialPct / 100).toFixed(4)})` }}
        ></div>
        <div
          className="mix-progress__bar mix-progress__bar--water"
          id="mixWaterBar"
          style={{ transform: `scaleX(${(waterPct / 100).toFixed(4)})` }}
        ></div>
      </div>

      <p className="mix-progress__explain" id="mixExplain">
        {t('mix.description', formatNumber(arterialMl, 0), formatNumber(waterMl, 0))}
      </p>
    </div>
  );
});
