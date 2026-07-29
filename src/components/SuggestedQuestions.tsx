/**
 * Preguntas rápidas sugeridas para el chatbot.
 *
 * Mejora: conjunto ampliado de preguntas que se muestran
 * aleatoriamente para cubrir más temas de la base de conocimiento.
 */

import { memo, useMemo } from 'react';

const ALL_QUESTIONS = [
  { label: '🔧 ¿Qué puedes hacer?', value: '¿Qué puedes hacer?' },
  { label: '📊 ¿Cómo se hace el cálculo?', value: '¿Cómo se hace el cálculo?' },
  { label: '📐 ¿Qué es el índice arterial?', value: '¿Qué es el índice arterial?' },
  { label: '📖 ¿Cómo usar la app?', value: '¿Cómo usar la app?' },
  { label: '🧪 Tipos de fluido arterial', value: 'Tipos de fluido arterial' },
  { label: '🛡️ Seguridad química', value: 'Seguridad química' },
  { label: '📄 Generar certificado', value: 'Generar certificado' },
  { label: '💧 ¿Qué es el edema?', value: '¿Qué es el edema?' },
  { label: '🧴 ¿Qué aditivos usar?', value: '¿Qué aditivos usar?' },
  { label: '🩸 Manejo de coágulos', value: 'Manejo de coágulos' },
  { label: '🌡️ Conservación prolongada', value: 'Conservación prolongada' },
  { label: '⚖️ Fuerza final de mezcla', value: 'Fuerza final de mezcla' },
  { label: '🚨 Derrame químico', value: 'Derrame químico' },
  { label: '📋 Glosario técnico', value: 'Glosario técnico' },
  { label: '👶 Casos infantiles', value: 'Casos infantiles' },
  { label: '🔍 Calcular índice necesario', value: 'Calcular índice necesario' },
] as const;

// Seleccionar 8 preguntas al azar para mostrar.
function selectRandomQuestions(): readonly { label: string; value: string }[] {
  const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 8);
}

interface SuggestedQuestionsProps {
  readonly onSelect: (question: string) => void;
}

export const SuggestedQuestions = memo(function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const questions = useMemo(() => selectRandomQuestions(), []);

  return (
    <div className="suggested-questions">
      <p className="suggested-questions__label">⚡ Preguntas rápidas:</p>
      <div className="suggested-questions__chips">
        {questions.map((q) => (
          <button
            key={q.value}
            className="suggested-questions__chip"
            type="button"
            onClick={() => onSelect(q.value)}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
});
