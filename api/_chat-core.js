/**
 * Lógica compartida del endpoint de chat (/api/chat).
 * La usan tanto la Serverless Function de Vercel (api/chat.ts)
 * como el mini-servidor local (scripts/dev-api.mjs).
 *
 * La API key vive SOLO en el servidor (variable GEMINI_API_KEY);
 * nunca se envía al navegador ni se registra en logs.
 */

import { GoogleGenAI } from '@google/genai';

// gemini-2.5-flash-lite ya no está disponible para usuarios nuevos;
// Google recomienda gemini-3.5-flash-lite (también en Free Tier).
const MODEL_ID = 'gemini-3.5-flash-lite';

// Límites básicos anti-abuso (best-effort: por instancia del servidor).
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_ITEM_CHARS = 2000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 12;

/** Contexto real del sitio, extraído de los textos e i18n del proyecto. */
const SYSTEM_PROMPT = `Eres el asistente virtual de la "Calculadora de Solución Arterial" de ESAMS (Escuela de Artes Mortuorias), una herramienta web gratuita para tanatopractores y estudiantes.

CONOCIMIENTO DEL SITIO (no inventes funciones que no existen):
- La calculadora determina cuánto concentrado arterial y cuánta agua mezclar usando la dilución C1·V1 = C2·V2.
- Campos: concentración del químico arterial en botella (%), selección del químico arterial, peso estimado en kg (opcional), volumen final a preparar en litros (opcional) y concentración deseada en el tanque (%; si se deja vacía se calcula automáticamente).
- Perfiles preestablecidos de concentración: Baja 0.1~1.99%, Media 2.0~3.99%, Fuerte +4.0%.
- El cálculo es en tiempo real y muestra la fórmula arterial recomendada, agua exacta, concentración final, volumen total y una fórmula detallada con gráfico de la mezcla.
- Rutina práctica sugerida por el sitio: cargar primero agua, incorporar el arterial concentrado, completar volumen y reevaluar drenaje, distensión y necesidad de refuerzo en cada etapa.
- Incluye un módulo de certificados que genera documentos PDF con firma.
- La página está en español, inglés e italiano, tiene modo claro/oscuro y permite compartir el resultado como imagen o texto.
- Contacto ESAMS: informes.esams@gmail.com · Instagram @esc.artes.mortuorias · TikTok @ESAMS.

REGLAS DE RESPUESTA:
1. Habla siempre en español natural, claro y sencillo. Respuestas breves (menos de 120 palabras) salvo que pidan detalle.
2. Responde principalmente sobre: la calculadora y su uso, embalsamamiento/tanatopraxia, químicos arteriales, diluciones y los servicios de ESAMS.
3. Si preguntan algo sin relación, respóndelo muy brevemente y regresa amablemente al tema de la calculadora o de ESAMS.
4. Si no tienes un dato específico (precios, fechas, personas), dilo honestamente y sugiere escribir a informes.esams@gmail.com.
5. Cuando el tema implique manejo de químicos, recuerda usar equipo de protección y seguir las hojas de seguridad del fabricante.
6. No des consejos médicos ni legales definitivos; recomienda acudir a profesionales o autoridades competentes.
7. Si preguntan si eres una IA o qué modelo te impulsa, confírmalo con honestidad: eres un asistente virtual con IA y puedes cometer errores.`;

const rateBuckets = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX_REQUESTS) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);

  // Poda periódica para que el Map no crezca sin control.
  if (rateBuckets.size > 1000) {
    for (const [key, stamps] of rateBuckets) {
      if (stamps.every((t) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(key);
    }
  }
  return false;
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  const validRoles = new Set(['user', 'model', 'assistant']);
  return rawHistory
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.text === 'string' &&
        validRoles.has(item.role),
    )
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : item.role,
      parts: [{ text: item.text.trim().slice(0, MAX_HISTORY_ITEM_CHARS) }],
    }))
    .filter((item) => item.parts[0].text.length > 0);
}

/**
 * Procesa una solicitud de chat ya parseada.
 * @returns {Promise<{status: number, payload: object}>}
 */
export async function handleChatRequest({ message, history, clientIp }) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('[chat] GEMINI_API_KEY no está configurada');
    return {
      status: 500,
      payload: { error: 'server_config', message: 'El servicio de chat no está disponible.' },
    };
  }

  if (
    typeof message !== 'string' ||
    message.trim().length === 0 ||
    message.trim().length > MAX_MESSAGE_CHARS
  ) {
    return {
      status: 400,
      payload: { error: 'invalid_request', message: 'Pregunta inválida.' },
    };
  }

  if (clientIp && isRateLimited(clientIp)) {
    return {
      status: 429,
      payload: {
        error: 'rate_limited',
        message: 'Demasiadas preguntas seguidas. Espera un momento antes de volver a intentar.',
      },
    };
  }

  const cleanMessage = message.trim().slice(0, MAX_MESSAGE_CHARS);
  const contents = [...sanitizeHistory(history)];
  contents.push({ role: 'user', parts: [{ text: cleanMessage }] });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

    const reply = (response.text ?? '').trim();
    if (!reply) {
      return {
        status: 502,
        payload: {
          error: 'empty_response',
          message: 'El asistente no pudo generar una respuesta. Intenta de nuevo.',
        },
      };
    }
    return { status: 200, payload: { reply } };
  } catch (err) {
    console.error('[chat] Error de Gemini:', err instanceof Error ? err.message : err);
    return {
      status: 502,
      payload: {
        error: 'upstream',
        message: 'Hubo un problema al consultar al asistente. Intenta nuevamente en unos segundos.',
      },
    };
  }
}
