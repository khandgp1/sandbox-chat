# Phase 6: Bot Engine Extraction

## Goal

Separate the bot's reply-generation logic from the Express route handler in `index.ts` so that the API layer is a thin orchestrator and the bot logic lives in a dedicated, independently testable service module.

---

## Decisions Made

| Decision | Choice |
|---|---|
| Service file location | `backend/src/services/botEngine.ts` |
| Public API | Single exported function `generateReply(message: string): string` |
| Routes refactor | Routes stay in `index.ts` (already thin enough) |
| Unit tests | Not in scope for Phase 6 — interface designed to be testable later |
| Reply logic | No change — keep `You said: <message>` echo behaviour |

---

## Current State

All logic lives in a single file: [`backend/src/index.ts`](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/index.ts)

The reply generation is inline at line 55:
```typescript
const reply = `You said: ${message.trim()}`;
```

There is no `services/` directory yet.

---

## Proposed Changes

### `backend/src/services/botEngine.ts` — **[NEW]**

Create a new service file that owns all reply-generation logic.

```typescript
/**
 * Bot Engine
 *
 * Generates a reply for a given incoming message.
 * Kept pure (no side-effects, no I/O) so it is easy to unit-test.
 */
export function generateReply(message: string): string {
  return `You said: ${message.trim()}`;
}
```

---

### `backend/src/index.ts` — **[MODIFY]**

1. Import `generateReply` from the new service.
2. Replace the inline reply string with a call to `generateReply(message)`.
3. No other changes — route structure, logging, and validation stay identical.

**Before:**
```typescript
// Compute response
const reply = `You said: ${message.trim()}`;
```

**After:**
```typescript
import { generateReply } from './services/botEngine';
// ...
// Compute response
const reply = generateReply(message.trim());
```

---

## Checklist

- [x] Create `backend/src/services/` directory
- [x] Create `backend/src/services/botEngine.ts` with `generateReply` function
- [x] Add JSDoc comment to `generateReply` noting it is side-effect-free
- [x] Import `generateReply` in `backend/src/index.ts`
- [x] Replace inline reply string with `generateReply(message.trim())` call
- [x] Verify backend still compiles (`tsc --noEmit` or `npm run build`)
- [x] Verify end-to-end: send a message via the UI and confirm the reply still works
- [x] Verify `GET /logs` still returns correct INCOMING + OUTGOING entries

---

## Verification Plan

### Automated
```bash
# In backend/
npm run build   # TypeScript compile check
```

### Manual
1. Start the backend (`npm run dev` in `backend/`).
2. Start the frontend (`npm run dev` in `frontend/`).
3. Open the browser, type a message, and confirm `You said: <message>` still appears.
4. Hit `GET http://localhost:3001/logs` and confirm entries are still logged correctly.

---

## Out of Scope

- No unit test files (deferred to Phase 9+).
- No change to the `routes/` structure.
- No change to reply logic or logging behaviour.
- No new dependencies.
