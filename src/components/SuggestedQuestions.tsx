import { memo } from 'react';

const QUESTIONS = [
  { label: '🔧 ¿Qué puedes hacer?', value: '¿Qué puedes hacer?' },
  { label: '📊 ¿Cómo se hace el cálculo?', value: '¿Cómo se hace el cálculo?' },
  { label: '📐 ¿Qué es el índice arterial?', value: '¿Qué es el índice arterial?' },
  { label: '📖 ¿Cómo usar la app?', value: '¿Cómo usar la app?' },
  { label: '🧪 Tipos de fluido arterial', value: 'Tipos de fluido arterial' },
  { label: '🛡️ Seguridad química', value: 'Seguridad química' },
  { label: '📄 Generar certificado', value: 'Generar certificado' },
  { label: '💧 ¿Qué es el edema?', value: '¿Qué es el edema?' },
] as const;

interface SuggestedQuestionsProps {
  readonly onSelect: (question: string) => void;
}

export const SuggestedQuestions = memo(function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="suggested-questions">
      <p className="suggested-questions__label">⚡ Preguntas rápidas:</p>
      <div className="suggested-questions__chips">
        {QUESTIONS.map((q) => (
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
