# 03 — Phase 4: Frontend ↔ Backend Integration

## Goal

Wire the React chat UI to the Express `POST /message` backend. Replace the hardcoded mock bot reply in `App.tsx` with a real `fetch()` call, add a typing-indicator loading state, and handle network errors gracefully as in-chat error bubbles.

After this phase, the full conversation loop works end-to-end:

```text
User types → Send → POST /message → Backend → JSON response → Chat window
```

---

## Decisions (from design interview)

| Decision | Choice | Rationale |
|---|---|---|
| API base URL | Hardcoded `http://localhost:3001` inside the fetch call | Local-only sandbox; no env vars needed |
| Loading state | Animated typing-indicator bubble in the chat window | Matches chat UX; gives visual feedback without disabling input |
| Error handling | Red ⚠️ error bubble inline in the chat | Developer-facing sandbox; no modals or alerts needed |
| Where to add fetch logic | `handleSend()` in `App.tsx` | Stays in one file; Phase 6 will extract a `botEngine` service |
| New files | None — only `App.tsx` and `chat.css` are modified | No new dependencies or files needed |

---

## Current State

| File | Relevant Detail |
|---|---|
| `frontend/src/App.tsx` | `handleSend()` appends a hardcoded bot reply via `setTimeout(..., 100)` — **this is the only thing being replaced** |
| `backend/src/index.ts` | `POST /message` is live on `http://localhost:3001`, CORS allows `http://localhost:5173`, returns `{ message: "You said: …" }` |
| All UI components | Complete and unchanged — `ChatHeader`, `MessageList`, `MessageBubble`, `MessageInput` stay as-is |

---

## Proposed Changes

### Frontend (`frontend/src/`)

#### [MODIFY] `frontend/src/App.tsx`

**1. Add `isLoading` state**

```tsx
const [isLoading, setIsLoading] = useState(false);
```

**2. Extract a `getTimestamp()` helper** to avoid repeating the locale-time logic:

```tsx
function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
```

**3. Replace the `handleSend()` mock with a real `fetch()` call**

Current (mock — lines 154–170 of App.tsx):
```tsx
// Trigger mock bot reply
setTimeout(() => {
  ...
  setMessages((prev) => [...prev, newBotMessage]);
}, 100);
```

Replacement — `handleSend` becomes `async`:
```tsx
setIsLoading(true);
try {
  const res = await fetch('http://localhost:3001/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'sandbox-user', message: trimmedInput }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  setMessages((prev) => [
    ...prev,
    { id: Date.now(), sender: 'bot', text: data.message, timestamp: getTimestamp() },
  ]);
} catch {
  setMessages((prev) => [
    ...prev,
    { id: Date.now(), sender: 'bot', text: '⚠️ Failed to reach the bot. Try again.', timestamp: getTimestamp() },
  ]);
} finally {
  setIsLoading(false);
}
```

**4. Add `<TypingIndicator />` inline component**

```tsx
function TypingIndicator() {
  return (
    <div className="message-row message-row--bot">
      <div className="bubble bubble--bot typing-indicator">
        <span /><span /><span />
      </div>
    </div>
  );
}
```

**5. Update `MessageListProps` and `MessageList` to render the typing indicator**

```tsx
interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;  // ← new
}

function MessageList({ messages, messagesEndRef, isLoading }: MessageListProps) {
  // ...existing render...
  return (
    <div className="chat-messages">
      {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}
```

**6. Pass `isLoading` from `App` to `MessageList`**

```tsx
<MessageList messages={messages} messagesEndRef={messagesEndRef} isLoading={isLoading} />
```

---

#### [MODIFY] `frontend/src/chat.css`

Add the typing indicator styles and keyframe animation:

```css
/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-6px); opacity: 1; }
}
```

Error bubbles inherit the existing `.bubble--bot` styles — no extra CSS needed.

---

## File Map

```
frontend/src/
├── App.tsx       ← MODIFY  (async handleSend, isLoading, TypingIndicator, real fetch)
└── chat.css      ← MODIFY  (typing-indicator animation)
```

No new npm packages. No backend changes.

---

## Verification Plan

### Pre-conditions

- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`

### Manual — Happy Path

1. Open `http://localhost:5173`.
2. Type `"Hello"` and press **Enter**.
3. Verify:
   - User bubble appears immediately (right-aligned, blue).
   - Typing indicator (3 bouncing dots) appears at bot position.
   - Indicator disappears; bot bubble appears with the backend reply (e.g. `"You said: Hello"`).
   - Chat auto-scrolls to latest message.

### Manual — Error Path

4. Stop the backend (`Ctrl+C`).
5. Send any message.
6. Verify:
   - Typing indicator appears briefly.
   - Error bubble appears: `"⚠️ Failed to reach the bot. Try again."`.
   - No crash or uncaught console error.

### Automated

```bash
cd frontend && npm run build
```

Build must complete with zero TypeScript errors.

---

## Progress Checklist

### App.tsx — State & Helpers
- [x] Add `isLoading` state (`useState<boolean>(false)`)
- [x] Extract `getTimestamp()` helper function

### App.tsx — `handleSend()` refactor
- [x] Make `handleSend` async
- [x] Remove `setTimeout` mock bot reply
- [x] Add `setIsLoading(true)` before fetch
- [x] `fetch('http://localhost:3001/message', ...)` with correct method, headers, body
- [x] Handle non-OK HTTP responses (`!res.ok → throw`)
- [x] Append real bot message from `data.message`
- [x] Catch block → append ⚠️ error message bubble
- [x] `finally` block → `setIsLoading(false)`

### App.tsx — TypingIndicator component
- [x] Create `<TypingIndicator />` inline component (3 `<span>` dots)
- [x] Update `MessageListProps` interface to include `isLoading: boolean`
- [x] Render `<TypingIndicator />` at bottom of `MessageList` when `isLoading === true`
- [x] Pass `isLoading` prop from `App` → `MessageList`

### chat.css — Typing indicator styles
- [x] Add `.typing-indicator` layout (flex, gap, padding)
- [x] Add `span` dot styles (size, border-radius, color, animation)
- [x] Add `typing-bounce` keyframe
- [x] Stagger animation-delay on 2nd and 3rd dots

### Verification
- [x] Happy path: real bot reply appears in chat
- [x] Typing indicator shows and hides correctly
- [x] Error path: backend stopped → error bubble, no crash
- [x] `npm run build` passes with zero TypeScript errors
