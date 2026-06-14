/**
 * Bot Engine
 *
 * Generates a reply for a given incoming message.
 * Kept pure (no side-effects, no I/O) so it is easy to unit-test.
 */
export function generateReply(message: string): string {
  return `You said: ${message.trim()}`;
}
