# Phase 7: Conversation Memory (In-Memory)

## Goal

Wire in a server-side in-memory conversation store so the bot engine receives the full message
history on every call. The bot will echo back the last N messages from history to prove the
context is flowing correctly — no AI, no NLP.

---

## Design Decisions

| Question | Decision |
|---|---|
| Where does the store live? | New file: `backend/src/services/conversationStore.ts` |
| How is history passed to the bot? | Injected as an argument: `generateReply(message, history)` — keeps botEngine pure |
| Message shape | `{ role: 'user' \| 'bot', text: string, timestamp: string }` |
| History limit | Unbounded for the lifetime of the server process |
| Bot behaviour with history | Echo the last N messages from history to prove wiring |

---

## Proposed Changes

### `backend/src/services/conversationStore.ts` — [NEW]

A dedicated module that owns the in-memory conversation history.

```typescript
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
```

---

### `backend/src/services/botEngine.ts` — [MODIFY]

Update `generateReply` to accept conversation history and echo back the last few messages.

**Before:**
```typescript
export function generateReply(message: string): string {
  return `You said: ${message.trim()}`;
}
```

**After:**
```typescript
import { Message } from './conversationStore';

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
```

---

### `backend/src/index.ts` — [MODIFY]

Orchestrate the new store in the `POST /message` route:

1. Import `getHistory` and `appendMessage` from `conversationStore`
2. Import updated `generateReply` signature
3. In the route handler:
   - Call `getHistory(userId)` before generating the reply
   - Call `appendMessage(userId, { role: 'user', ... })` after receiving the message
   - Call `generateReply(message, history)` with the history
   - Call `appendMessage(userId, { role: 'bot', ... })` after generating the reply

No other routes are changed.

---

## Checklist

- [ ] Create `backend/src/services/conversationStore.ts`
  - [ ] Define `Message` type
  - [ ] Implement `getHistory(userId)`
  - [ ] Implement `appendMessage(userId, message)`
- [ ] Modify `backend/src/services/botEngine.ts`
  - [ ] Update `generateReply` signature to accept `history: Message[]`
  - [ ] Update reply logic to echo recent context
- [ ] Modify `backend/src/index.ts`
  - [ ] Import `getHistory` and `appendMessage`
  - [ ] Fetch history before generating reply
  - [ ] Append user message to store
  - [ ] Pass history to `generateReply`
  - [ ] Append bot reply to store
- [ ] Manual verification
  - [ ] Send 3+ messages and confirm context appears in bot replies
  - [ ] Restart server and confirm history resets (in-memory only)

---

## Verification Plan

### Manual

1. Start the backend (`npm run dev` from `/backend`)
2. Open the chat UI
3. Send: `"Hi"` → bot replies with no prior context
4. Send: `"My name is John"` → bot reply echoes the previous `[user] Hi`
5. Send: `"How are you?"` → bot reply echoes the last 3 messages
6. Restart the server → send a message → confirm history is empty again

### What success looks like

```
User:  Hi
Bot:   You said: "Hi". No prior context.

User:  My name is John
Bot:   You said: "My name is John". Recent context: [user] Hi | [bot] You said: "Hi"...

User:  How are you?
Bot:   You said: "How are you?". Recent context: [user] Hi | [bot] ... | [user] My name is John
```
