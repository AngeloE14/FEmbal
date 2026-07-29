export type ChatRole = 'user' | 'bot';

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  readonly createdAt: string;
}

export interface KnowledgeAction {
  readonly label: string;
  readonly type: 'suggest' | 'navigate';
  readonly value: string;
}

export interface KnowledgeEntry {
  readonly id: string;
  readonly title: string;
  readonly keywords: readonly string[];
  readonly responses: readonly string[];
  readonly actions?: readonly KnowledgeAction[];
}

export interface IntentMatch {
  readonly entry: KnowledgeEntry;
  readonly score: number;
  readonly matchedKeywords: readonly string[];
}
