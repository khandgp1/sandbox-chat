import { Message } from './conversationStore';

/**
 * Bot Engine
 *
 * Generates a reply for a given incoming message.
 * Kept pure (no side-effects, no I/O) so it is easy to unit-test.
 */
const ECHO_COUNT = 3;

export function generateReply(message: string, history: Message[]): string {
  if (history.length === 0) {
    return `You said: "${message.trim()}". No prior context.`;
  }

  const recent = history
    .slice(-ECHO_COUNT)
    .map((m) => `[${m.role}] ${m.text}`)
    .join(' | ');

  return `You said: "${message.trim()}". Recent context: ${recent}`;
}

