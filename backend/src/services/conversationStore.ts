import { ChatMessage } from '../types/chatMessage';

export type ConversationEntry = ChatMessage & {
  role: 'user' | 'bot';
};

// Keyed by userId — supports single sandbox user but is extensible.
const store = new Map<string, ConversationEntry[]>();

export function getHistory(userId: string): ConversationEntry[] {
  return store.get(userId) ?? [];
}

export function appendMessage(userId: string, message: ConversationEntry): void {
  const history = store.get(userId) ?? [];
  history.push(message);
  store.set(userId, history);
}

