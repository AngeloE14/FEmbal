/**
 * Motor de matching inteligente para Mictlan.
 * 
 * Mejoras implementadas:
 * 1. TF-IDF (Term Frequency - Inverse Document Frequency): pondera términos
 *    por su importancia relativa en la base de conocimiento. Un término como
 *    "ictericia" tiene más peso que "fluido" porque aparece en menos entradas.
 * 2. Similitud coseno: mide el ángulo entre el vector de la consulta y cada
 *    documento, capturando relevancia temática aunque no haya keywords exactas.
 * 3. Sinónimos y expansión de consulta: "formol" → "formaldehído", "hinchazón" → "edema".
 * 4. Caché de consultas: evita recomputar para preguntas repetidas.
 * 5. Stemming ligero: reduce palabras a su raíz (ej. "calculando" → "calcul").
 * 6. Filtro de stop words: ignora palabras vacías (artículos, preposiciones, etc.).
 */

import { KNOWLEDGE_BASE } from '../data/knowledgeBase';
import type { IntentMatch, KnowledgeEntry } from '../types/chat';

export const UNKNOWN_DOMAIN_RESPONSE =
  'No tengo información sobre ese tema. Puedes consultarme sobre: mezcla arterial, índice de fluido, preservación, aditivos, casos especiales (edema, ictericia, descomposición), seguridad, certificados o procedimientos técnicos.';

// ──────────────────────────────────────────────
// 1. HERRAMIENTAS LINGÜÍSTICAS
// ──────────────────────────────────────────────

const SPANISH_STOP_WORDS = new Set([
  'a', 'al', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'del', 'desde',
  'durante', 'e', 'el', 'en', 'entre', 'hacia', 'hasta', 'la', 'las', 'le',
  'lo', 'los', 'más', 'menos', 'muy', 'o', 'para', 'pero', 'por', 'que',
  'se', 'según', 'sin', 'sobre', 'tras', 'un', 'una', 'uno', 'unas', 'unos',
  'y', 'ya', 'su', 'sus', 'es', 'como', 'esta', 'este', 'esto', 'ese', 'eso',
  'esa', 'esas', 'esos', 'tu', 'te', 'me', 'mi', 'nos', 'os', 'les', 'nosotros',
  'vosotros', 'ellos', 'ellas', 'ello', 'cual', 'quien', 'cuando', 'donde',
  'como', 'cuanto', 'tan', 'tanto', 'tal', 'tales', 'cada', 'todo', 'toda',
  'todos', 'todas', 'nada', 'algo', 'alguien', 'ninguno', 'ninguna', 'nunca',
  'siempre', 'también', 'solo', 'sólo', 'aunque', 'pues', 'porque', 'sin',
  'no', 'si', 'sea', 'ser', 'han', 'has', 'ha', 'he', 'hemos', 'había',
  'habían', 'habrá', 'habrán', 'será', 'serán', 'era', 'eran', 'fue',
  'fueron', 'sido', 'está', 'están', 'estaba', 'estaban', 'estado',
  'tiene', 'tienen', 'tenía', 'tenían', 'tuvo', 'tuvieron', 'tener',
  'hace', 'hacen', 'hacía', 'hacían', 'hacer', 'hay', 'hubo', 'hubiera',
]);

// Mapa de sinónimos: términos alternativos que deben expandirse a su
// forma canónica para mejorar el matching semántico.
const SYNONYM_MAP: Record<string, string[]> = {
  'formol': ['formaldehido'],
  'formolizado': ['formaldehido'],
  'formula': ['formula', 'mezcla', 'proporcion', 'calculo'],
  'formulas': ['formula', 'mezcla'],
  'proporciones': ['proporcion', 'formula'],
  'proporcion': ['proporcion', 'formula'],
  'diluir': ['dilucion', 'mezcla'],
  'dilucion': ['dilucion', 'mezcla', 'formula'],
  'hinchazon': ['edema'],
  'hinchado': ['edema'],
  'retencion': ['edema'],
  'humedo': ['edema'],
  'seco': ['deshidratacion', 'seco'],
  'reseco': ['deshidratacion'],
  'resequedad': ['deshidratacion'],
  'amarillo': ['ictericia'],
  'amarillento': ['ictericia'],
  'putrefaccion': ['descomposicion'],
  'podrido': ['descomposicion'],
  'olor': ['descomposicion'],
  'herida': ['trauma'],
  'heridas': ['trauma'],
  'lesion': ['trauma'],
  'lesiones': ['trauma'],
  'incision': ['trauma', 'autopsia'],
  'incisiones': ['trauma', 'autopsia'],
  'gordo': ['obesidad'],
  'grasa': ['obesidad', 'adiposo'],
  'adiposo': ['obesidad'],
  'sobrepeso': ['obesidad'],
  'nino': ['infantil', 'pediatrico'],
  'ninos': ['infantil', 'pediatrico'],
  'bebe': ['infantil'],
  'bebes': ['infantil'],
  'pediatrico': ['infantil', 'pediatrico'],
  'rigido': ['rigor'],
  'rigidez': ['rigor'],
  'endurecimiento': ['rigor', 'firmeza'],
  'frio': ['refrigeracion'],
  'nevera': ['refrigeracion'],
  'conservacion': ['refrigeracion', 'preservacion'],
  'eyector': ['drenaje'],
  'extraer': ['drenaje'],
  'inyectar': ['inyeccion', 'distribucion'],
  'infundir': ['inyeccion'],
  'canula': ['canulacion', 'vasos'],
  'canulas': ['vasos'],
  'tubo': ['canula'],
  'maquina': ['presion', 'flujo', 'bomba', 'instrumental'],
  'bomba': ['presion', 'flujo', 'instrumental'],
  'presion': ['presion', 'flujo'],
  'maquillaje': ['cosmetica', 'coloracion'],
  'tinte': ['coloracion'],
  'cosmetico': ['cosmetica', 'coloracion'],
  'reconstruir': ['restauracion', 'reconstruccion'],
  'reparar': ['restauracion'],
  'pdf': ['certificado'],
  'documento': ['certificado', 'documentacion'],
  'descargar': ['certificado'],
  'firmar': ['certificado'],
  'firma': ['certificado'],
  'proteger': ['seguridad'],
  'proteccion': ['seguridad'],
  'guante': ['seguridad'],
  'guantes': ['seguridad'],
  'mascarilla': ['seguridad'],
  'cancerigeno': ['seguridad'],
  'toxico': ['seguridad'],
  'veneno': ['seguridad'],
  'paso': ['fases', 'guia', 'procedimiento'],
  'pasos': ['fases', 'guia', 'procedimiento'],
  'etapas': ['fases'],
  'fase': ['fases'],
  'herramienta': ['instrumental'],
  'herramientas': ['instrumental'],
  'equipo': ['instrumental', 'equipamiento'],
  'instrumentos': ['instrumental'],
  'coagulo': ['coagulos'],
  'coagulos': ['coagulos'],
  'trombo': ['coagulos'],
  'obstruccion': ['coagulos'],
  'bloqueo': ['coagulos'],
  'ph': ['acondicionador', 'composicion'],
  'alcalino': ['acondicionador'],
  'acido': ['acondicionador'],
  'glicerina': ['humectantes'],
  'glicerol': ['humectantes'],
  'lanolina': ['humectantes'],
  'hidratar': ['humectantes', 'deshidratacion'],
  'rehidratar': ['humectantes', 'deshidratacion'],
  'surfactante': ['aditivo', 'coinyeccion'],
  'booster': ['aditivo', 'coinyeccion'],
  'cavidad': ['cavidad'],
  'toracica': ['cavidad'],
  'abdominal': ['cavidad'],
  'trocar': ['cavidad', 'instrumental'],
  'aspiracion': ['cavidad'],
  'organos': ['cavidad'],
  'visceras': ['cavidad'],
  'sangre': ['drenaje', 'coagulos'],
  'hemorragia': ['drenaje', 'coagulos'],
  'vena': ['vasos', 'drenaje'],
  'venas': ['vasos', 'drenaje'],
  'arteria': ['vasos'],
  'arterias': ['vasos'],
  'carotida': ['vasos'],
  'femoral': ['vasos'],
  'axilar': ['vasos'],
  'yugular': ['vasos', 'drenaje'],
  'mezclar': ['mezcla', 'formula'],
  'solucion': ['mezcla', 'formula', 'fluido'],
  'calcular': ['calculo', 'formula', 'como-funciona'],
  'computar': ['calculo'],
  'resultado': ['proporcion', 'fuerza'],
  'certificacion': ['certificado'],
  'concentracion': ['indice', 'fuerza'],
  'fijacion': ['firmeza', 'indice'],
  'biocida': ['composicion', 'seguridad'],
  'desinfectante': ['composicion', 'seguridad'],
  'formoldehído': ['formaldehido'],
  'algo': ['continuar'],
  'otro': ['continuar'],
  'informacion': ['uso-chatbot'],
  'ayudar': ['saludo', 'que-puedes-hacer'],
  'pregunta': ['uso-chatbot'],
  'preguntas': ['uso-chatbot'],
  'mictlan': ['saludo', 'que-puedes-hacer'],
  'chat': ['uso-chatbot'],
  'bot': ['uso-chatbot'],
  'online': ['privacidad'],
  'offline': ['privacidad'],
  'internet': ['privacidad'],
  'conexion': ['privacidad'],
  'datos': ['privacidad', 'historial-chat'],
  'privacidad': ['privacidad'],
  'local': ['privacidad'],
  'storage': ['historial-chat'],
  'guardar': ['historial-chat'],
  'borrar': ['historial-chat'],
  'historial': ['historial-chat'],
  'conversacion': ['historial-chat'],
  'empezar': ['guia-rapida'],
  'inicio': ['guia-rapida', 'saludo'],
  'iniciar': ['guia-rapida'],
  'tutorial': ['guia-rapida'],
  'litros': ['conversiones'],
  'mililitros': ['conversiones'],
  'galon': ['conversiones'],
  'galones': ['conversiones'],
  'onzas': ['conversiones'],
  'onza': ['conversiones'],
  'unidad': ['conversiones'],
  'unidades': ['conversiones'],
  'error': ['validacion'],
  'falla': ['validacion'],
  'bug': ['validacion'],
  'no funciona': ['validacion'],
  'invalido': ['validacion'],
  'negativo': ['validacion'],
  'vacio': ['validacion'],
  'incorrecto': ['validacion'],
  'agradecer': ['agradecimiento'],
  'gracias': ['agradecimiento'],
  'adios': ['despedida'],
  'chao': ['despedida'],
  'bye': ['despedida'],
  'saludar': ['saludo'],
  'hola': ['saludo'],
  'buen dia': ['saludo'],
  'ok': ['afirmacion'],
  'okay': ['afirmacion'],
  'si': ['afirmacion'],
  'claro': ['afirmacion'],
  'entiendo': ['afirmacion'],
  'comprendo': ['afirmacion'],
};

// Stemming ligero para español: elimina sufijos comunes de plural y género.
function lightStem(word: string): string {
  if (word.length <= 3) return word;

  // Plurales: eliminamos 's' final si la palabra termina en 'es' o 'as'/'os'
  if (word.endsWith('es') && word.length > 4) {
    const candidate = word.slice(0, -2);
    if (candidate.length > 2) return candidate;
  } else if ((word.endsWith('as') || word.endsWith('os')) && word.length > 4) {
    const candidate = word.slice(0, -2);
    if (candidate.length > 2) return candidate;
  } else if (word.endsWith('s') && !word.endsWith('as') && !word.endsWith('os') && !word.endsWith('es')) {
    const candidate = word.slice(0, -1);
    if (candidate.length > 2) return candidate;
  }

  return word;
}

function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1 && !SPANISH_STOP_WORDS.has(t))
    .map(lightStem);
}

// Expande una consulta agregando sinónimos de cada término.
function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
  }

  return [...expanded];
}

// ──────────────────────────────────────────────
// 2. TF-IDF Y SIMILITUD COSENO
// ──────────────────────────────────────────────

interface TfIdfVector {
  readonly [term: string]: number;
}

interface IndexedDocument {
  readonly index: number;
  readonly entry: KnowledgeEntry;
  readonly tokens: string[];
  readonly vector: TfIdfVector;
}

let cachedDocuments: IndexedDocument[] | null = null;
let cachedIdf: Record<string, number> | null = null;
let cachedVocabulary: string[] | null = null;

function computeTf(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  const total = tokens.length;

  for (const token of tokens) {
    tf[token] = (tf[token] ?? 0) + 1;
  }

  for (const key of Object.keys(tf)) {
    tf[key] /= total;
  }

  return tf;
}

// Precomputa los vectores TF-IDF de toda la base de conocimiento.
function buildTfIdfIndex(kb: readonly KnowledgeEntry[]): {
  documents: IndexedDocument[];
  idf: Record<string, number>;
  vocabulary: string[];
} {
  // Tokenizar cada entrada de conocimiento como un documento.
  const docTokens: string[][] = kb.map((entry) => {
    const text = [
      entry.title,
      ...entry.keywords,
      ...entry.responses,
    ].join(' ');
    return tokenize(text);
  });

  // Construir vocabulario global.
  const termSet = new Set<string>();
  for (const tokens of docTokens) {
    for (const t of tokens) termSet.add(t);
  }
  const vocabulary = [...termSet];
  const N = docTokens.length;

  // Calcular IDF para cada término del vocabulario.
  const idf: Record<string, number> = {};
  for (const term of vocabulary) {
    let docsWithTerm = 0;
    for (const tokens of docTokens) {
      if (tokens.includes(term)) docsWithTerm++;
    }
    // Fórmula IDF suavizada para evitar división por cero.
    idf[term] = Math.log((N + 1) / (docsWithTerm + 1)) + 1;
  }

  // Calcular vectores TF-IDF para cada documento.
  const documents: IndexedDocument[] = kb.map((entry, index) => {
    const tokens = docTokens[index];
    const tf = computeTf(tokens);
    const vector: Record<string, number> = {};

    for (const term of vocabulary) {
      const tfValue = tf[term] ?? 0;
      if (tfValue > 0) {
        vector[term] = tfValue * idf[term];
      }
    }

    // Normalizar el vector (longitud unitaria para similitud coseno).
    let magnitude = 0;
    for (const val of Object.values(vector)) {
      magnitude += val * val;
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude > 0) {
      for (const key of Object.keys(vector)) {
        vector[key] /= magnitude;
      }
    }

    return { index, entry, tokens, vector };
  });

  return { documents, idf, vocabulary };
}

function getOrBuildIndex(kb?: readonly KnowledgeEntry[]): {
  documents: IndexedDocument[];
  idf: Record<string, number>;
  vocabulary: string[];
} {
  const data = kb ?? KNOWLEDGE_BASE;

  if (!kb && cachedDocuments && cachedIdf && cachedVocabulary) {
    return { documents: cachedDocuments, idf: cachedIdf, vocabulary: cachedVocabulary };
  }

  const index = buildTfIdfIndex(data);
  if (!kb) {
    cachedDocuments = index.documents;
    cachedIdf = index.idf;
    cachedVocabulary = index.vocabulary;
  }

  return index;
}

function cosineSimilarity(queryVec: TfIdfVector, docVec: TfIdfVector): number {
  let dotProduct = 0;

  // Iteramos sobre el vector más pequeño para eficiencia.
  const [smaller, larger] =
    Object.keys(queryVec).length <= Object.keys(docVec).length
      ? [queryVec, docVec]
      : [docVec, queryVec];

  for (const term of Object.keys(smaller)) {
    if (larger[term] !== undefined) {
      dotProduct += smaller[term] * larger[term];
    }
  }

  return dotProduct;
}

// ──────────────────────────────────────────────
// 3. CACHÉ DE CONSULTAS
// ──────────────────────────────────────────────

interface CacheEntry {
  readonly query: string;
  readonly result: IntentMatch | null;
  readonly timestamp: number;
}

const QUERY_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minuto
const MAX_CACHE_SIZE = 50;

function getCachedResult(query: string): IntentMatch | null | undefined {
  const cached = QUERY_CACHE.get(query);
  if (!cached) return undefined;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    QUERY_CACHE.delete(query);
    return undefined;
  }

  return cached.result;
}

function setCachedResult(query: string, result: IntentMatch | null): void {
  // Limpiar caché si excede el tamaño máximo.
  if (QUERY_CACHE.size >= MAX_CACHE_SIZE) {
    const oldest = [...QUERY_CACHE.entries()].sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );
    const toDelete = oldest.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
    for (const [key] of toDelete) {
      QUERY_CACHE.delete(key);
    }
  }

  QUERY_CACHE.set(query, { query, result, timestamp: Date.now() });
}

// ──────────────────────────────────────────────
// 4. FUNCIÓN PRINCIPAL DE MATCHING
// ──────────────────────────────────────────────

export function findMatchingIntent(
  message: string,
  knowledgeBase: readonly KnowledgeEntry[] = KNOWLEDGE_BASE,
): IntentMatch | null {
  const normalizedMessage = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedMessage) {
    return null;
  }

  // 1. Revisar caché primero.
  const cached = getCachedResult(normalizedMessage);
  if (cached !== undefined) return cached;

  // 2. Tokenizar y expandir con sinónimos.
  const tokens = tokenize(normalizedMessage);
  const expandedTokens = expandTokens(tokens);

  if (expandedTokens.length === 0) {
    return null;
  }

  // 3. Obtener o construir el índice TF-IDF.
  const index = getOrBuildIndex(knowledgeBase);
  const { documents, vocabulary } = index;

  // 4. Construir vector TF-IDF para la consulta.
  const queryTf = computeTf(expandedTokens);
  const queryVector: Record<string, number> = {};

  for (const term of vocabulary) {
    const tfValue = queryTf[term] ?? 0;
    if (tfValue > 0) {
      queryVector[term] = tfValue * (index.idf[term] ?? 1);
    }
  }

  // Normalizar vector de consulta.
  let queryMagnitude = 0;
  for (const val of Object.values(queryVector)) {
    queryMagnitude += val * val;
  }
  queryMagnitude = Math.sqrt(queryMagnitude);
  if (queryMagnitude > 0) {
    for (const key of Object.keys(queryVector)) {
      queryVector[key] /= queryMagnitude;
    }
  }

  // 5. Calcular similitud coseno con cada documento.
  let bestScore = 0;
  let bestDoc: IndexedDocument | null = null;

  for (const doc of documents) {
    const similarity = cosineSimilarity(queryVector, doc.vector);
    if (similarity > bestScore) {
      bestScore = similarity;
      bestDoc = doc;
    }
  }

  // 6. Umbral mínimo de similitud para considerar un match válido.
  const MATCH_THRESHOLD = 0.08;

  if (!bestDoc || bestScore < MATCH_THRESHOLD) {
    setCachedResult(normalizedMessage, null);
    return null;
  }

  // 7. Extraer keywords coincidentes para el resultado.
  const matchedKeywords = bestDoc.entry.keywords.filter((kw) => {
    const kwTokens = tokenize(kw);
    return kwTokens.some((t) => expandedTokens.includes(t));
  });

  const match: IntentMatch = {
    entry: bestDoc.entry,
    score: Math.round(bestScore * 1000) / 1000,
    matchedKeywords,
  };

  setCachedResult(normalizedMessage, match);
  return match;
}

// ──────────────────────────────────────────────
// 5. SELECCIÓN DE RESPUESTA
// ──────────────────────────────────────────────

const pickRandom = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export function getLocalBotResponse(message: string): string {
  const match = findMatchingIntent(message);
  if (!match) return UNKNOWN_DOMAIN_RESPONSE;
  return pickRandom(match.entry.responses);
}

// ──────────────────────────────────────────────
// 6. UTILIDADES EXPORTADAS
// ──────────────────────────────────────────────

// Devuelve las acciones asociadas a la mejor entrada que coincide.
export function getActionsForMessage(message: string): KnowledgeEntry['actions'] {
  const match = findMatchingIntent(message);
  return match?.entry?.actions;
}
