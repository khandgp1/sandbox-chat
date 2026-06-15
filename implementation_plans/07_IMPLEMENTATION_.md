# Phase 8: Telegram Compatibility Layer

## Background

Phases 1–7 are complete. The backend now has:
- A working `POST /message` route in `backend/src/index.ts`
- A `botEngine.ts` service that generates replies
- A `conversationStore.ts` that tracks history using a local `Message` type

The types used internally (`Message`, `LogEntry`) are ad-hoc and not standardized.
Phase 8 introduces a **canonical internal message contract** so that the same bot engine
can serve both the sandbox UI and a future Telegram webhook with zero changes to core logic.

---

## Goals (from KICKSTART.md)

- Create a shared `ChatMessage` model
- Standardize the request structure
- Standardize the response structure
- Document the future Telegram → `ChatMessage` field mapping

---

## Decisions (resolved via /grill-me)

| Decision | Choice |
|---|---|
| Where does `ChatMessage` live? | `backend/src/types/chatMessage.ts` |
| Replace existing `Message` type? | Yes — migrate in-place in `conversationStore.ts` |
| `ChatMessage` shape | Match KICKSTART spec exactly: `{ userId, text, timestamp }` |
| Standardize bot response shape? | Yes — add `BotReply { text, timestamp }` in the same file |
| Telegram mapping docs location | `docs/TELEGRAM_MAPPING.md` at project root |

---

## Proposed Changes

### 1. Types

#### [NEW] `backend/src/types/chatMessage.ts`

Define the canonical inbound and outbound contracts:

```typescript
export type ChatMessage = {
  userId: string;
  text: string;
  timestamp: string; // ISO 8601
};

export type BotReply = {
  text: string;
  timestamp: string; // ISO 8601
};
```

---

### 2. Conversation Store

#### [MODIFY] `backend/src/services/conversationStore.ts`

- Import `ChatMessage` from the new types file
- Replace the local `Message` type with a `ConversationEntry` type that extends
  `ChatMessage` with a `role` field (needed for history tracking):
  `ConversationEntry = ChatMessage & { role: 'user' | 'bot' }`
- Update `getHistory` and `appendMessage` signatures accordingly

> **Note on the role field**: `ChatMessage` per the KICKSTART spec is `{ userId, text, timestamp }`.
> The store needs `role` to distinguish user turns from bot turns in history.
> We keep `role` as a store-level concern via `ConversationEntry`.

---

### 3. Bot Engine

#### [MODIFY] `backend/src/services/botEngine.ts`

- Import `ChatMessage` and `BotReply` from the types file
- Update `generateReply` signature:
  ```typescript
  // Before
  generateReply(message: string, history: Message[]): string

  // After
  generateReply(message: ChatMessage, history: ConversationEntry[]): BotReply
  ```
- Return a `BotReply` object (`{ text, timestamp }`) instead of a raw string

---

### 4. Route Layer

#### [MODIFY] `backend/src/index.ts`

- Import `ChatMessage` and `BotReply` from the types file
- Construct a `ChatMessage` from the validated request body before passing to the engine
- Consume the returned `BotReply` object when writing logs and building the JSON response
- `LogEntry` updated to align with `ChatMessage`/`BotReply` field names

---

### 5. Documentation

#### [NEW] `docs/TELEGRAM_MAPPING.md`

Explain how a future Telegram `Update` object would map to `ChatMessage`:

```
Telegram Update field          →   ChatMessage field
─────────────────────────────────────────────────────
message.from.id (as string)   →   userId
message.text                  →   text
message.date (Unix → ISO)     →   timestamp
```

---

## Checklist

- [ ] Create `backend/src/types/chatMessage.ts` with `ChatMessage` and `BotReply` types
- [ ] Update `conversationStore.ts`: remove local `Message`, introduce `ConversationEntry`
- [ ] Update `botEngine.ts`: accept `ChatMessage`, return `BotReply`
- [ ] Update `index.ts`: construct `ChatMessage` from request body, consume `BotReply` from engine
- [ ] Create `docs/TELEGRAM_MAPPING.md` with field-mapping table
- [ ] Verify backend compiles with no TypeScript errors (`npx tsc --noEmit`)
- [ ] Verify end-to-end message flow still works in the browser

---

## Verification Plan

### Automated

```bash
cd backend && npx tsc --noEmit
```

No TypeScript errors expected.

### Manual

1. Start backend (`npm run dev` in `/backend`)
2. Start frontend (`npm run dev` in `/frontend`)
3. Send a message in the browser — response should appear as before
4. Check `/logs` endpoint — log entries should be intact
5. Confirm the bot still echoes context from conversation history

---

## Out of Scope for Phase 8

- No actual Telegram webhook (explicitly out of scope per KICKSTART.md)
- No changes to the frontend
- No AI or external API integration
