export type Message = {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
};

// Keyed by userId — supports single sandbox user but is extensible.
const store = new Map<string, Message[]>();

export function getHistory(userId: string): Message[] {
  return store.get(userId) ?? [];
}

export function appendMessage(userId: string, message: Message): void {
  const history = store.get(userId) ?? [];
  history.push(message);
  store.set(userId, history);
}
