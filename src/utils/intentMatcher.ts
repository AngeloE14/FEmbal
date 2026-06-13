import { KNOWLEDGE_BASE } from '../data/knowledgeBase';
import type { IntentMatch, KnowledgeEntry } from '../types/chat';

export const UNKNOWN_DOMAIN_RESPONSE =
  'No tengo respuesta para eso. Probá preguntar sobre: mezcla, índice, preservación, aditivos, casos especiales (edema, ictericia, descomposición), seguridad o certificados.';

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%/.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const includesKeyword = (normalizedMessage: string, keyword: string): boolean => {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(' ')) {
    return normalizedMessage.includes(normalizedKeyword);
  }

  const tokenPattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedKeyword)}(?=\\s|$)`);
  return tokenPattern.test(normalizedMessage);
};

const getKeywordWeight = (keyword: string): number => {
  const normalizedKeyword = normalizeText(keyword);
  const wordCount = normalizedKeyword.split(' ').filter(Boolean).length;
  return wordCount + Math.min(normalizedKeyword.length / 18, 2);
};

export function findMatchingIntent(
  message: string,
  knowledgeBase: readonly KnowledgeEntry[] = KNOWLEDGE_BASE,
): IntentMatch | null {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return null;
  }

  let bestMatch: IntentMatch | null = null;

  for (const entry of knowledgeBase) {
    const matchedKeywords = entry.keywords.filter((keyword) => includesKeyword(normalizedMessage, keyword));

    if (matchedKeywords.length === 0) {
      continue;
    }

    const score = matchedKeywords.reduce((total, keyword) => total + getKeywordWeight(keyword), 0);
    const currentMatch: IntentMatch = {
      entry,
      score,
      matchedKeywords,
    };

    if (!bestMatch || currentMatch.score > bestMatch.score) {
      bestMatch = currentMatch;
    }
  }

  return bestMatch;
}

const pickRandom = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function getLocalBotResponse(message: string): string {
  const match = findMatchingIntent(message);
  if (!match) return UNKNOWN_DOMAIN_RESPONSE;
  return pickRandom(match.entry.responses);
}
