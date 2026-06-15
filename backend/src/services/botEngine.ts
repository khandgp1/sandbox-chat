import { ChatMessage, BotReply } from '../types/chatMessage';
import { ConversationEntry } from './conversationStore';

/**
 * Bot Engine
 *
 * Generates a reply for a given incoming message.
 * Kept pure (no side-effects, no I/O) so it is easy to unit-test.
 */
const ECHO_COUNT = 3;

export function generateReply(message: ChatMessage, history: ConversationEntry[]): BotReply {
  const trimmed = message.text.trim();
  let text: string;
  
  if (history.length === 0) {
    text = `You said: "${trimmed}". No prior context.`;
  } else {
    const recent = history
      .slice(-ECHO_COUNT)
      .map((m) => `[${m.role}] ${m.text}`)
      .join(' | ');

    text = `You said: "${trimmed}". Recent context: ${recent}`;
  }

  return {
    text,
    timestamp: new Date().toISOString(),
  };
}


