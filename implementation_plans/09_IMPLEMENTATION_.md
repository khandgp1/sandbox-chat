# Phase 10: Webhook Relay Mode

## Background

Phases 1–9 are complete. The sandbox currently uses a synchronous request-response model: the UI POSTs a message, the backend calls `botEngine.ts` inline, and returns the reply in the same HTTP response.

Phase 10 introduces **Webhook Relay Mode** — an opt-in mode where the sandbox behaves like Telegram does with a real bot backend. Instead of generating its own reply, the sandbox:

1. Forwards the user message to an external bot server (via `POST /webhook`)
2. Receives the bot's reply on a new `POST /incoming-reply` endpoint
3. Serves the reply to the UI via `GET /incoming-reply` (polled every ~1s)

This allows an external bot algorithm project to plug into the sandbox without modifying any sandbox source code — just by setting `BOT_WEBHOOK_URL` in `.env`.

When `BOT_WEBHOOK_URL` is **not set**, the sandbox falls back to its existing placeholder `botEngine.ts` with zero regression.

---

## Decisions (resolved via /grill-me)

| Decision | Choice |
|:---|:---|
| Scope | All three layers: backend forwarding, new sandbox endpoints, UI polling |
| Fallback | `BOT_WEBHOOK_URL` absent → fall back to existing `botEngine.ts` placeholder |
| Reply storage | One pending reply slot per `userId` — newest overwrites unread |
| Reply consumption | `GET /incoming-reply` returns and clears the slot in one operation |
| Loading state | No TypingIndicator — UI sends and waits silently |
| Polling strategy | Poll `GET /incoming-reply` every ~1s continuously (same pattern as `/logs`) |

---

## Communication Flow

```text
Human types in UI
       |
       | POST /message { userId, message }
       v
Sandbox Backend (port 3001)
       |
       |-- if BOT_WEBHOOK_URL set:
       |       POST /webhook { userId, message, history }  →  Bot Server
       |       200 OK ←
       |       (stores "awaiting reply" state for userId)
       |
       |-- if BOT_WEBHOOK_URL NOT set:
       |       calls botEngine.generateReply() as before
       |       returns { message } synchronously to UI
       |
       | → returns 200 OK to UI (no reply body in webhook mode)
       v
Bot Server processes, then:
       POST /incoming-reply { userId, message }  →  Sandbox Backend
       Sandbox stores reply in per-userId slot
       200 OK ←

UI polls GET /incoming-reply every ~1s:
       → Sandbox returns { message } and clears the slot
       → UI appends bot reply to chat
```

---

## Proposed Changes

### Backend — `backend/src/`

#### [MODIFY] `backend/src/index.ts`

**1. Read `BOT_WEBHOOK_URL` from environment:**
```typescript
const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL ?? null;
```

**2. Modify `POST /message` handler:**
- If `BOT_WEBHOOK_URL` is set:
  - Build `ChatMessage` and log INCOMING as before
  - Fire `POST BOT_WEBHOOK_URL` with `{ userId, message: chatMessage.text, history }`
  - Do **not** wait for a reply — ack the UI immediately with `200 OK` and an empty body (or `{ status: 'forwarded' }`)
  - Store the user message in `conversationStore` (so history is available for the next turn)
- If `BOT_WEBHOOK_URL` is not set:
  - Execute existing synchronous `botEngine.generateReply()` logic unchanged

**3. Add `POST /incoming-reply` endpoint:**
- Accepts `{ userId: string, message: string }`
- Validates both fields (non-empty strings)
- Stores the reply in the in-memory reply slot (keyed by `userId`)
- Logs the reply as an OUTGOING `LogEntry`
- Appends the reply to `conversationStore` with `role: 'bot'`
- Returns `200 OK`

**4. Add `GET /incoming-reply` endpoint:**
- Accepts optional `?userId=` query param (defaults to `"sandbox-user"`)
- If a pending reply exists for that `userId`:
  - Clears the slot
  - Returns `{ message: string }`
- If no reply is pending:
  - Returns `{ message: null }`

---

#### [NEW] `backend/src/services/replyStore.ts`

A simple in-memory store for pending bot replies, keyed by `userId`.

```typescript
// Pending reply slots: one per userId.
// The newest reply overwrites any unread one.

const pendingReplies = new Map<string, string>();

export function storePendingReply(userId: string, message: string): void {
  pendingReplies.set(userId, message);
}

export function consumePendingReply(userId: string): string | null {
  const reply = pendingReplies.get(userId) ?? null;
  if (reply !== null) pendingReplies.delete(userId);
  return reply;
}
```

---

### Environment — `.env` / `.env.example`

#### [MODIFY] `.env.example`

Add the new optional variable with a comment:

```dotenv
PORT=3001
VITE_API_URL=http://localhost:3001

# Optional: set this to enable Webhook Relay Mode.
# When set, the sandbox forwards messages to this URL instead of using the built-in bot engine.
# BOT_WEBHOOK_URL=http://localhost:4000/webhook
```

#### [MODIFY] `.env`

Add the same commented-out line (user uncomments when integrating with bot project).

---

### Frontend — `frontend/src/App.tsx`

#### [MODIFY] `frontend/src/App.tsx`

**1. Add a `GET /incoming-reply` polling effect:**

Alongside the existing `GET /logs` polling interval (every 3s), add a second `setInterval` polling `GET /incoming-reply` every 1s. When the response contains a non-null `message`, append it to the `messages` state as a bot message.

```typescript
// Poll for async bot replies (Webhook Relay Mode)
useEffect(() => {
  const pollForReply = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/incoming-reply?userId=sandbox-user`);
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          const botMessage: Message = {
            id: Date.now(),
            sender: 'bot',
            text: data.message,
            timestamp: getTimestamp(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      }
    } catch {
      // silently ignore
    }
  };

  const interval = setInterval(pollForReply, 1000);
  return () => clearInterval(interval);
}, []);
```

**2. Update `handleSend` for webhook relay mode:**

In webhook relay mode, `POST /message` returns `200 OK` with no bot reply in the body. The current `handleSend` reads `data.message` and displays it immediately — this must be guarded.

Update `handleSend` to only append a bot message from the `POST /message` response if `data.message` is present (truthy). If absent, do nothing — the polling effect will pick up the reply.

---

### Documentation

#### [MODIFY] `docs/INTEGRATION_GUIDE.md`

No structural changes needed — the guide already documents the two-POST contract correctly. Add a note under "What Changes in sandbox-chat" marking Phase 10 as **implemented** once this plan is complete.

---

## Checklist

### Backend
- [ ] Read `BOT_WEBHOOK_URL` from `process.env` in `backend/src/index.ts`
- [ ] Modify `POST /message` handler: branch on `BOT_WEBHOOK_URL` presence
  - [ ] Webhook path: fire-and-forget POST to `BOT_WEBHOOK_URL`, return `{ status: 'forwarded' }` to UI
  - [ ] Fallback path: existing synchronous `botEngine.generateReply()` logic (unchanged)
- [ ] Create `backend/src/services/replyStore.ts` with `storePendingReply` and `consumePendingReply`
- [ ] Add `POST /incoming-reply` endpoint (validate, store, log, append to conversationStore)
- [ ] Add `GET /incoming-reply` endpoint (consume and return, or return `{ message: null }`)

### Environment
- [ ] Update `.env.example` with commented-out `BOT_WEBHOOK_URL`
- [ ] Update `.env` with commented-out `BOT_WEBHOOK_URL`

### Frontend
- [ ] Add `GET /incoming-reply` polling effect (every 1s) in `App.tsx`
- [ ] Guard `handleSend` so it only appends a bot reply if `data.message` is present

### Verification
- [ ] TypeScript compiles with no errors: `cd backend && npx tsc --noEmit`
- [ ] Linting passes: `npm run lint` from root
- [ ] **Fallback mode** (no `BOT_WEBHOOK_URL`): existing chat still works end-to-end
- [ ] **Webhook relay mode**: manually test with a curl stub (see Verification Plan)

---

## Verification Plan

### Automated

```bash
# TypeScript
cd backend && npx tsc --noEmit

# Linting
npm run lint
```

### Manual — Fallback Mode (regression check)

1. Ensure `BOT_WEBHOOK_URL` is **not** set in `.env`
2. `npm run dev` from root
3. Open `http://localhost:5173`
4. Send a message → placeholder bot reply appears synchronously ✓

### Manual — Webhook Relay Mode (new feature)

1. Set `BOT_WEBHOOK_URL=http://localhost:4000/webhook` in `.env`
2. Start sandbox: `npm run dev`
3. In a second terminal, run a stub bot server that:
   - Listens on port 4000
   - Accepts `POST /webhook` and immediately POSTs `{ userId: "sandbox-user", message: "Stub reply!" }` to `http://localhost:3001/incoming-reply`
4. Open `http://localhost:5173`
5. Send a message → no immediate bot reply in chat
6. Within ~1s → "Stub reply!" appears in chat ✓
7. Check Logs panel → INCOMING and OUTGOING entries are both present ✓

---

## Out of Scope for Phase 10

- WebSockets or Server-Sent Events
- Multi-user support
- Authentication or secrets on the `/incoming-reply` endpoint
- Retry logic if the bot server is unreachable
- Telegram integration
