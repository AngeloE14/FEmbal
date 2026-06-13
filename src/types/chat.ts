export type ChatRole = 'user' | 'bot';

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly createdAt: string;
}

export interface KnowledgeEntry {
  readonly id: string;
  readonly title: string;
  readonly keywords: readonly string[];
  readonly response: string;
}

export interface IntentMatch {
  readonly entry: KnowledgeEntry;
  readonly score: number;
  readonly matchedKeywords: readonly string[];
}
