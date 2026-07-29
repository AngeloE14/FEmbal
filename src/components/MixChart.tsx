import { memo } from 'react';
import '../styles/components/MixChart.css';
import { useI18n } from '../hooks/useI18n';
import { formatNumber } from '../utils/formatters';

interface MixChartProps {
  arterialMl: number;
  waterMl: number;
  totalSolutionMl: number;
}

const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GAP_DEG = 1.5;
const GAP_LENGTH = (GAP_DEG / 360) * CIRCUMFERENCE;

export const MixChart = memo(function MixChart({ arterialMl, waterMl, totalSolutionMl }: MixChartProps) {
  const { t } = useI18n();
  const arterialPct = totalSolutionMl > 0 ? (arterialMl / totalSolutionMl) * 100 : 0;
  const waterPct = totalSolutionMl > 0 ? (waterMl / totalSolutionMl) * 100 : 0;

  const waterDash = Math.max((waterPct / 100) * CIRCUMFERENCE - GAP_LENGTH, 0);
  const arterialDash = Math.max((arterialPct / 100) * CIRCUMFERENCE - GAP_LENGTH, 0);

  const waterAngle = -90;
  const arterialAngle = -90 + (waterPct / 100) * 360;

  return (
    <div className="mix-chart">
      <figure className="mix-chart__figure">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mix-chart__svg"
          role="img"
          aria-label={t('mix.aria')}
        >
          <circle
            className="mix-chart__track"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
          />

          {waterPct > 0 && (
            <circle
              className="mix-chart__segment mix-chart__segment--water"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${waterDash} ${CIRCUMFERENCE}`}
              transform={`rotate(${waterAngle} ${SIZE / 2} ${SIZE / 2})`}
            />
          )}

          {arterialPct > 0 && (
            <circle
              className="mix-chart__segment mix-chart__segment--chemical"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${arterialDash} ${CIRCUMFERENCE}`}
              transform={`rotate(${arterialAngle} ${SIZE / 2} ${SIZE / 2})`}
            />
          )}

          <text
            className="mix-chart__value"
            x={SIZE / 2}
            y={SIZE / 2}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {formatNumber(arterialPct, 1)}%
          </text>
        </svg>

        <figcaption className="mix-chart__legend">
          <span className="mix-chart__legend-item">
            <span className="mix-chart__dot mix-chart__dot--chemical" />
            {t('mix.arterial', formatNumber(arterialPct, 1))}
          </span>
          <span className="mix-chart__legend-item">
            <span className="mix-chart__dot mix-chart__dot--water" />
            {t('mix.water', formatNumber(waterPct, 1))}
          </span>
        </figcaption>
      </figure>

      <p className="mix-chart__description">
        {t('mix.description', formatNumber(arterialMl, 0), formatNumber(waterMl, 0))}
      </p>
    </div>
  );
});
