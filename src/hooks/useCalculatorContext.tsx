/**
 * Provider central de la calculadora.
 *
 * Este archivo concentra la "orquestación":
 * 1) Estado del formulario.
 * 2) Validación y cálculo con funciones puras.
 * 3) Estado visual de resultados/feedback.
 *
 * Migrado desde la lógica imperativa del proyecto original en JS.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue, type ReactNode } from 'react';
import {
  COARSE_POINTER_QUERY,
  DEFAULT_INPUTS,
  type CalculatorInputs,
  type CaseData,
} from '../utils/constants';
import { useI18n } from './useI18n';
import type { TranslationFn } from '../utils/i18n';
import {
  formatNumber,
  formatVolumeMlAndLiters,
  parseInputNumber,
  roundToOneDecimal,
  sanitizeDecimalText,
} from '../utils/formatters';
import { buildCaseSignature, buildRecommendation, validateCaseData } from '../utils/calculator';
import {
  CalculatorFormContext,
  CalculatorResultsContext,
  type CalculatorFormContextValue,
  type CalculatorResultsContextValue,
} from './calculatorContext';

function buildCaseDataFromInputs(inputs: CalculatorInputs): CaseData {
  return {
    concentrado: parseInputNumber(inputs.concentrado),
    objetivoManual: parseInputNumber(inputs.objetivoManual),
    peso: parseInputNumber(inputs.peso),
    volumenPrepararLitros: parseInputNumber(inputs.volumenPrepararLitros),
  };
}

function buildShareSummary(
  recommendation: NonNullable<CalculatorResultsContextValue['currentRecommendation']>,
  t: TranslationFn,
): string {
  if (!recommendation.ok || !recommendation.concentrado || !recommendation.finalTarget || !recommendation.totalSolutionMl) {
    return '';
  }

  const arterialMl = recommendation.arterialMl ?? 0;
  const waterMl = recommendation.waterMl ?? 0;
  const totalSolutionMl = recommendation.totalSolutionMl;

  const lines = [
    t('share.text.title'),
    `${t('share.text.concentration')}${formatNumber(roundToOneDecimal(recommendation.concentrado), 1)}%`,
    `${t('share.text.target')}${formatNumber(roundToOneDecimal(recommendation.finalTarget), 1)}%`,
  ];

  if (recommendation.peso != null) {
    lines.splice(1, 0, `${t('share.text.weight')}${formatNumber(roundToOneDecimal(recommendation.peso), 1)} kg`);
  }

  lines.push(
    '',
    `${t('share.text.arterial')}${formatNumber(roundToOneDecimal(arterialMl), 1)} ml`,
    `${t('share.text.water')}${formatNumber(roundToOneDecimal(waterMl), 1)} ml`,
    '',
    `${t('share.text.total')}${formatVolumeMlAndLiters(totalSolutionMl)}`,
  );

  return lines.join('\n');
}

function getShareUrl(): string {
  const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  const openGraphUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content;
  return canonicalUrl || openGraphUrl || window.location.href;
}

function buildShareMessage(summary: string, t: TranslationFn, url: string): string {
  return `${summary}\n\n${t('share.text.calculator')}${url}`;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = text;
  tempTextArea.setAttribute('readonly', 'readonly');
  tempTextArea.style.position = 'fixed';
  tempTextArea.style.left = '-9999px';
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(tempTextArea);

  if (!copied) {
    throw new Error('copy_failed');
  }
}

async function buildShareImageFile(
  recommendation: NonNullable<CalculatorResultsContextValue['currentRecommendation']>,
  t: TranslationFn,
): Promise<File | null> {
  const arterialMl = recommendation.arterialMl ?? 0;
  const waterMl = recommendation.waterMl ?? 0;
  const totalMl = recommendation.totalSolutionMl ?? 0;
  const concPct = formatNumber(roundToOneDecimal(recommendation.concentrado ?? 0), 1);
  const targetPct = formatNumber(roundToOneDecimal(recommendation.finalTarget ?? 0), 1);
  const waterPct = totalMl > 0 ? ((waterMl / totalMl) * 100).toFixed(1) : '0';
  const arterialPct = totalMl > 0 ? ((arterialMl / totalMl) * 100).toFixed(1) : '0';
  const totalL = (totalMl / 1000).toFixed(2);
  const arterialFmt = formatNumber(roundToOneDecimal(arterialMl), 1);
  const waterFmt = formatNumber(roundToOneDecimal(waterMl), 1);
  const pesoVal = recommendation.peso != null ? roundToOneDecimal(recommendation.peso) : null;

  const W = 600;
  const H = 360;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1f9d7d';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

  const logoImg = new Image();
  logoImg.crossOrigin = 'anonymous';
  let logoOk = false;
  const logoLoaded = new Promise<void>((resolve) => {
    logoImg.onload = () => {
      logoOk = true;
      resolve();
    };
    logoImg.onerror = () => resolve();
    const base = import.meta.env.BASE_URL;
    logoImg.src = `${base}assets/images/logo-circular.png`;
  });

  ctx.fillStyle = '#1f9d7d';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(t('share.text.title'), 40, 34);

  ctx.strokeStyle = '#1f9d7d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 56);
  ctx.lineTo(W - 40, 56);
  ctx.stroke();

  ctx.fillStyle = '#222222';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  let y = 88;
  const lh = 24;
  const concLabel = t('share.text.concentration');
  const targetLabel = t('share.text.target');

  if (pesoVal != null) {
    const weightLabel = t('share.text.weight');
    ctx.fillText(weightLabel, 40, y);
    ctx.font = '15px sans-serif';
    ctx.fillText(`${formatNumber(pesoVal, 1)} kg`, 40 + ctx.measureText(weightLabel).width, y);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(concLabel, 320, y);
    ctx.font = '15px sans-serif';
    ctx.fillText(`${concPct}%`, 320 + ctx.measureText(concLabel).width, y);

    y += lh + 4;

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(targetLabel, 40, y);
    ctx.font = '15px sans-serif';
    ctx.fillText(`${targetPct}%`, 40 + ctx.measureText(targetLabel).width, y);
  } else {
    ctx.fillText(concLabel, 40, y);
    ctx.font = '15px sans-serif';
    ctx.fillText(`${concPct}%`, 40 + ctx.measureText(concLabel).width, y);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(targetLabel, 320, y);
    ctx.font = '15px sans-serif';
    ctx.fillText(`${targetPct}%`, 320 + ctx.measureText(targetLabel).width, y);
  }

  y += lh + 8;
  ctx.strokeStyle = '#dddddd';
  ctx.beginPath();
  ctx.moveTo(40, y - 4);
  ctx.lineTo(W - 40, y - 4);
  ctx.stroke();

  y += 10;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(t('share.text.arterial'), 40, y);
  ctx.fillText(t('share.text.water'), 320, y);

  y += 20;
  ctx.font = '15px sans-serif';
  ctx.fillText(`${arterialFmt} ml  (${arterialPct}%)`, 40, y);
  ctx.fillText(`${waterFmt} ml  (${waterPct}%)`, 320, y);

  y += 36;
  ctx.strokeStyle = '#dddddd';
  ctx.beginPath();
  ctx.moveTo(40, y - 4);
  ctx.lineTo(W - 40, y - 4);
  ctx.stroke();

  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${t('share.text.total')}${totalL} L (${formatNumber(totalMl, 0)} ml)`, 40, y + 22);

  await logoLoaded;

  const footerText = 'ESAMS · Formulador Arterial';
  ctx.font = '11px sans-serif';
  const footerTextW = ctx.measureText(footerText).width;
  const logoR = 9;
  const gap = 5;
  const totalFooterW = (logoOk ? logoR * 2 + gap : 0) + footerTextW;
  const footerX = (W - totalFooterW) / 2;
  const footerY = H - 16;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#999999';
  if (logoOk) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(footerX + logoR, footerY - 2, logoR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, footerX, footerY - logoR - 2, logoR * 2, logoR * 2);
    ctx.restore();
  }

  ctx.fillText(
    footerText,
    footerX + (logoOk ? logoR * 2 + gap : 0),
    footerY,
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    return null;
  }

  const ts = Date.now();
  const fileName = `ESAMS-resultado-${ts}.png`;
  return new File([blob], fileName, { type: 'image/png' });
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [selectedChemical, setSelectedChemical] = useState<CalculatorFormContextValue['selectedChemical']>(null);

  const [error, setError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [isResultsUpdating, setIsResultsUpdating] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<CalculatorResultsContextValue['currentRecommendation']>(
    null,
  );
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);

  const lastCaseSignatureRef = useRef('');
  const lastResultSignatureRef = useRef('');
  const animationFrameRef = useRef<number>(0);
  const animationTimeoutRef = useRef<number>(0);
  const shareImageFileRef = useRef<File | null>(null);

  useEffect(() => {
    let canceled = false;

    async function updateShareImageFile() {
      if (!currentRecommendation?.ok) {
        if (!canceled) {
          shareImageFileRef.current = null;
          setShareImageFile(null);
        }
        return;
      }

      const file = await buildShareImageFile(currentRecommendation, t);
      if (!canceled) {
        shareImageFileRef.current = file;
        setShareImageFile(file);
      }
    }

    updateShareImageFile();

    return () => {
      canceled = true;
      shareImageFileRef.current = null;
      setShareImageFile(null);
    };
  }, [currentRecommendation, t]);

  // En pantallas táctiles usamos un debounce un poco mayor para evitar recálculos en cada tecla.
  const inputDebounceMs = useMemo(() => {
    if (typeof window === 'undefined') {
      return 50;
    }
    return window.matchMedia(COARSE_POINTER_QUERY).matches ? 90 : 50;
  }, []);

  const shouldAnimateResults = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia(COARSE_POINTER_QUERY).matches;
    return !reducedMotion && !coarsePointer;
  }, []);

  const caseData = useMemo(() => buildCaseDataFromInputs(inputs), [inputs]);
  const deferredCaseData = useDeferredValue(caseData);
  const isCaseDataStale = deferredCaseData !== caseData;

  const clearOutputs = useCallback(() => {
    setCurrentRecommendation(null);
    setShareFeedback('');
    setIsResultsUpdating(false);
    lastResultSignatureRef.current = '';
  }, []);

  const triggerResultAnimation = useCallback(
    (signature: string) => {
      if (signature === lastResultSignatureRef.current) {
        return;
      }

      lastResultSignatureRef.current = signature;

      if (!shouldAnimateResults) {
        setIsResultsUpdating(false);
        return;
      }

      setIsResultsUpdating(false);

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        setIsResultsUpdating(true);
      });

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = window.setTimeout(() => {
        setIsResultsUpdating(false);
      }, 520);
    },
    [shouldAnimateResults],
  );

  const runCalculation = useCallback(
    (nextCaseData: CaseData) => {
      const validationError = validateCaseData(nextCaseData);

      if (validationError) {
        setError(validationError);
        clearOutputs();
        return;
      }

      const recommendation = buildRecommendation(nextCaseData);

      if (!recommendation.ok) {
        setError(recommendation.error ?? 'No se pudo calcular la recomendacion.');
        clearOutputs();
        return;
      }

      setError('');
      setCurrentRecommendation(recommendation);
      setShareFeedback('');

      const signature = [
        recommendation.arterialMl?.toFixed(2),
        recommendation.waterMl?.toFixed(2),
        recommendation.finalTarget?.toFixed(2),
        recommendation.totalSolutionMl?.toFixed(2),
      ].join('|');

      triggerResultAnimation(signature);
    },
    [clearOutputs, triggerResultAnimation],
  );

  useEffect(() => {
    if (isCaseDataStale) return;

    const caseSignature = buildCaseSignature(deferredCaseData);

    if (caseSignature === lastCaseSignatureRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastCaseSignatureRef.current = caseSignature;
      runCalculation(deferredCaseData);
    }, inputDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [deferredCaseData, inputDebounceMs, runCalculation, isCaseDataStale]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const resetForm = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setSelectedChemical(null);
    setError('');
    setShareFeedback('');
    setCurrentRecommendation(null);
    setIsResultsUpdating(false);
    lastCaseSignatureRef.current = '';
    lastResultSignatureRef.current = '';
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }

      resetForm();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [resetForm]);

  const updateInput = useCallback((field: keyof CalculatorInputs, rawValue: string) => {
    setInputs((previous) => ({
      ...previous,
      [field]: sanitizeDecimalText(rawValue),
    }));
  }, []);

  const selectChemical = useCallback((option: NonNullable<CalculatorFormContextValue['selectedChemical']>) => {
    setSelectedChemical(option);
    setInputs((previous) => ({
      ...previous,
      concentrado: option.value,
    }));
  }, []);

  const clearChemicalSelection = useCallback(() => {
    setSelectedChemical(null);
  }, []);

  const applyPreset = useCallback((value: number) => {
    setInputs((previous) => ({
      ...previous,
      objetivoManual: String(value),
    }));
  }, []);

  const shareResult = useCallback(async () => {
    if (!currentRecommendation || !currentRecommendation.ok) {
      setError(t('share.error'));
      return;
    }

    const summary = buildShareSummary(currentRecommendation, t);
    if (!summary) {
      setError(t('share.error'));
      return;
    }

    const pageUrl = getShareUrl();
    const message = buildShareMessage(summary, t, pageUrl);

    try {
      await copyTextToClipboard(message);
      setShareFeedback(t('share.copied'));
    } catch {
      window.prompt(t('share.prompt.manual'), message);
      setShareFeedback(t('share.copied.manual'));
    }
  }, [currentRecommendation, t]);

  const shareResultAsImage = useCallback(async () => {
    if (!currentRecommendation?.ok) return;

    const summary = buildShareSummary(currentRecommendation, t);
    if (!summary) {
      setShareFeedback(t('share.image.error'));
      return;
    }

    const file = shareImageFileRef.current ?? shareImageFile ?? await buildShareImageFile(currentRecommendation, t);

    if (file) {
      shareImageFileRef.current = file;
      setShareImageFile(file);
    }

    if (!file) {
      setShareFeedback(t('share.image.error'));
      return;
    }

    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setShareFeedback(t('share.image.success'));
  }, [currentRecommendation, shareImageFile, t]);

  // Este valor sólo cambia cuando cambia el formulario.
  const formContextValue = useMemo<CalculatorFormContextValue>(
    () => ({
      inputs,
      selectedChemical,
      isConcentradoLocked: selectedChemical !== null,
      updateInput,
      selectChemical,
      clearChemicalSelection,
      applyPreset,
    }),
    [applyPreset, clearChemicalSelection, inputs, selectedChemical, selectChemical, updateInput],
  );

  // Este valor sólo cambia cuando cambia el resultado/feedback.
  const resultsContextValue = useMemo<CalculatorResultsContextValue>(
    () => ({
      error,
      shareFeedback,
      isResultsUpdating,
      currentRecommendation,
      resetForm,
      shareResult,
      shareResultAsImage,
    }),
    [currentRecommendation, error, isResultsUpdating, resetForm, shareFeedback, shareResult, shareResultAsImage],
  );

  return (
    <CalculatorFormContext.Provider value={formContextValue}>
      <CalculatorResultsContext.Provider value={resultsContextValue}>{children}</CalculatorResultsContext.Provider>
    </CalculatorFormContext.Provider>
  );
}
