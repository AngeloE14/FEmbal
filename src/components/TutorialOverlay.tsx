/**
 * TutorialOverlay — Modal interactivo de aprendizaje paso a paso.
 *
 * Muestra una serie de 8 pasos educativos que guían al usuario
 * sobre el uso de la calculadora de solución arterial.
 *
 * Cambios realizados para móvil:
 * - useRef + tabIndex para manejo de foco accesible
 * - useCallback en todos los handlers para evitar re-renders hijos
 * - useEffect con cleanup para body scroll lock
 * - Navegación por teclado (Escape, flechas)
 * - Estados reset al cerrar (currentStep vuelve a 0)
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import '../styles/components/TutorialOverlay.css';

interface Step {
  key: string;
  icon: string;
}

const STEPS: Step[] = [
  { key: 'tutorial.step1.title', icon: '🧪' },
  { key: 'tutorial.step2.title', icon: '🔬' },
  { key: 'tutorial.step3.title', icon: '⚗️' },
  { key: 'tutorial.step4.title', icon: '⚖️' },
  { key: 'tutorial.step5.title', icon: '🎯' },
  { key: 'tutorial.step6.title', icon: '📊' },
  { key: 'tutorial.step7.title', icon: '📋' },
  { key: 'tutorial.step8.title', icon: '📤' },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialOverlay = memo(function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const totalSteps = STEPS.length;

  // Los handlers usan useCallback para mantener referencias estables
  // y evitar que el useEffect de teclado se dispare en cada render.
  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    onClose();
  }, [onClose]);

  // Navegación por teclado: Escape cierra, flechas izquierda/derecha navegan.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, goNext, goPrev]);

  // Bloquea el scroll del body mientras el overlay está abierto.
  // Al cerrar, restaura el overflow original.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    overlayRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div
      className="tutorial-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('tutorial.title')}
      tabIndex={-1}
    >
      {/* Backdrop: clic en fondo cierra el tutorial */}
      <div className="tutorial-overlay__backdrop" onClick={handleClose} aria-hidden="true" />

      <div className="tutorial-overlay__card">
        {/* Botón de cerrar siempre visible con fondo para fácil target táctil */}
        <button
          className="tutorial-overlay__close"
          type="button"
          onClick={handleClose}
          aria-label={t('tutorial.close')}
        >
          ✕
        </button>

        {/* Puntos de progreso: cada uno es un botón para navegación directa */}
        <div className="tutorial-overlay__progress">
          {STEPS.map((_, index) => (
            <button
              key={index}
              className={`tutorial-overlay__dot ${index === currentStep ? 'tutorial-overlay__dot--active' : ''} ${index < currentStep ? 'tutorial-overlay__dot--done' : ''}`}
              type="button"
              onClick={() => goToStep(index)}
              aria-label={`${t('tutorial.step')} ${index + 1}`}
            />
          ))}
        </div>

        {/* Icono del paso actual */}
        <div className="tutorial-overlay__icon" aria-hidden="true">
          {step.icon}
        </div>

        {/* Título traducido del paso */}
        <h3 className="tutorial-overlay__title">
          {t(`${step.key}`)}
        </h3>

        {/* Descripción educativa traducida */}
        <p className="tutorial-overlay__desc">
          {t(`tutorial.step${currentStep + 1}.desc`)}
        </p>

        {/* Barra de navegación inferior */}
        <div className="tutorial-overlay__nav">
          <button
            className="tutorial-overlay__btn tutorial-overlay__btn--prev"
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label={t('tutorial.prev')}
          >
            ← {t('tutorial.prev')}
          </button>

          <span className="tutorial-overlay__counter">
            {currentStep + 1} / {totalSteps}
          </span>

          {isLast ? (
            <button
              className="tutorial-overlay__btn tutorial-overlay__btn--done"
              type="button"
              onClick={handleClose}
            >
              {t('tutorial.done')} ✓
            </button>
          ) : (
            <button
              className="tutorial-overlay__btn tutorial-overlay__btn--next"
              type="button"
              onClick={goNext}
              aria-label={t('tutorial.next')}
            >
              {t('tutorial.next')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
