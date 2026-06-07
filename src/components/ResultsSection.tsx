/**
 * Panel de resultados de la calculadora.
 * Origen: caja de resultados del HTML tradicional.
 */

import { memo, useCallback, useMemo, type ReactNode } from 'react';
import '../styles/components/ResultsSection.css';
import { useCalculatorResults } from '../hooks/useCalculator';
import { useI18n } from '../hooks/useI18n';
import { formatMlAndOz, formatNumber } from '../utils/formatters';
import { MixProgress } from './MixProgress';
import { ShareActions } from './ShareActions';

const FORMULA_TOKEN_REGEX = /(C1·V1|C2·V2|C1|C2|V1|V2|->|=|\bx\b|\d+(?:[.,]\d+)?\s?(?:kg|gal|ml|L|fl oz|psi|%))/g;

function renderFormulaRichText(text?: string): ReactNode {
  if (!text) {
    return '—';
  }

  const chunks: ReactNode[] = [];
  let cursor = 0;
  let tokenCount = 0;

  for (const match of text.matchAll(FORMULA_TOKEN_REGEX)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      chunks.push(text.slice(cursor, start));
    }

    let tokenClassName = 'formula-token formula-token--formula';

    if (/^\d/.test(token)) {
      tokenClassName = 'formula-token formula-token--number';
    } else if (token === '=' || token === '->') {
      tokenClassName = 'formula-token formula-token--operator';
    }

    chunks.push(
      <span key={`${token}-${start}-${tokenCount}`} className={tokenClassName}>
        {token}
      </span>,
    );

    cursor = start + token.length;
    tokenCount += 1;
  }

  if (cursor < text.length) {
    chunks.push(text.slice(cursor));
  }

  return chunks;
}

export const ResultsSection = memo(function ResultsSection() {
  const { t } = useI18n();
  const {
    currentRecommendation,
    error,
    shareFeedback,
    shareResult,
    shareResultAsImage,
    isResultsUpdating,
  } = useCalculatorResults();

  const hasResult = Boolean(currentRecommendation?.ok);
  const arterialMl = hasResult ? currentRecommendation?.arterialMl ?? 0 : 0;
  const waterMl = hasResult ? currentRecommendation?.waterMl ?? 0 : 0;
  const totalSolutionMl = hasResult ? currentRecommendation?.totalSolutionMl ?? 0 : 0;
  const baseObjective = hasResult ? currentRecommendation?.baseObjective ?? 0 : 0;
  const finalTarget = hasResult ? currentRecommendation?.finalTarget ?? 0 : 0;

  const articleClass = useMemo(() => [
    'box',
    'box-results',
    'tarjeta-interactiva',
    'panel-resultados',
    isResultsUpdating ? 'is-updating panel-resultados--actualizando' : '',
  ]
    .join(' ')
    .trim(), [isResultsUpdating]);

  const badgeLabel = t('results.badge');

  const formulaVolume = useMemo(() => renderFormulaRichText(currentRecommendation?.formulaVolume), [currentRecommendation?.formulaVolume]);
  const formulaConcentration = useMemo(() => renderFormulaRichText(currentRecommendation?.formulaConcentration), [currentRecommendation?.formulaConcentration]);
  const formulaFinal = useMemo(() => renderFormulaRichText(currentRecommendation?.formulaFinal), [currentRecommendation?.formulaFinal]);

  const handleShare = useCallback(() => shareResult(), [shareResult]);
  const handleShareAsImage = useCallback(() => shareResultAsImage(), [shareResultAsImage]);

  return (
    <article className={articleClass} data-badge={badgeLabel}>
      <h2>{t('results.title')}</h2>

      <div className="result-main bloque-resultado">
        <div className="value" id="quimicoMl">
          {hasResult ? `${formatNumber(arterialMl, 1)} ${t('chemical.arterial')}` : t('results.empty')}
        </div>
        <div className="sub" id="quimicoOz">
          {hasResult
            ? `${formatNumber(arterialMl / 29.5735, 1)} fl oz | ${t('results.sub.base')} ${formatNumber(baseObjective, 2)}% -> ${t('results.sub.final')} ${formatNumber(finalTarget, 2)}%`
            : '—'}
        </div>
      </div>

      {hasResult ? (
        <MixProgress arterialMl={arterialMl} waterMl={waterMl} totalSolutionMl={totalSolutionMl} />
      ) : (
        <div className="mix-progress bloque-mezcla" aria-live="polite">
          <div className="mix-progress__head">
            <span id="mixChemicalPct">{t('results.arterial.empty')}</span>
            <span id="mixWaterPct">{t('results.water.empty')}</span>
          </div>
          <div className="mix-progress__track" role="img" aria-label={t('mix.aria')}>
            <div className="mix-progress__bar mix-progress__bar--chemical" id="mixChemicalBar"></div>
            <div className="mix-progress__bar mix-progress__bar--water" id="mixWaterBar"></div>
          </div>
          <p className="mix-progress__explain" id="mixExplain">
            {t('results.empty.explain')}
          </p>
        </div>
      )}

      <div className="mini-grid resumen-metrico">
        <div className="tile tarjeta-dato">
          <strong>{t('results.water.label')}</strong>
          <span id="aguaMl">{hasResult ? formatMlAndOz(waterMl, 0, 1) : '—'}</span>
        </div>

        <div className="tile tarjeta-dato">
          <strong>{t('results.concentration.label')}</strong>
          <span id="verificacion">{hasResult ? `${formatNumber(finalTarget, 2)}%` : '—'}</span>
        </div>

        <div className="tile tarjeta-dato">
          <strong>{t('results.volume.label')}</strong>
          <span id="volumenFinal">
            {hasResult
              ? `${formatNumber(totalSolutionMl / 1000, 2)} L / ${formatNumber(totalSolutionMl, 0)} ml`
              : '—'}
          </span>
        </div>
      </div>

      <section className="formula-card tarjeta-informativa" aria-live="polite">
        <h3>{t('results.formula.title')}</h3>
        <p id="formulaVolume" className="formula-line formula-line--volume">
          {formulaVolume}
        </p>
        <p id="formulaConcentration" className="formula-line formula-line--concentration">
          {formulaConcentration}
        </p>
        <p id="formulaFinal" className="formula-line formula-line--final">
          {formulaFinal}
        </p>
      </section>

      <div className="alert error" id="error" style={{ display: error ? 'block' : 'none' }}>
        {error}
      </div>

      <ShareActions
        shareFeedback={shareFeedback}
        hasResult={hasResult}
        onShare={handleShare}
        onShareAsImage={handleShareAsImage}
      />

      <p className="notes">
        {t('results.practice.note')}
      </p>
    </article>
  );
});
