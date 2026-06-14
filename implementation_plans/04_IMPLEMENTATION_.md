# 04 — Phase 5: Message Logging Panel

## Goal

Add a developer-facing **Message Log** panel below the chat window. Every INCOMING (user → backend) and OUTGOING (backend → user) message is captured on the backend, stored in-memory, and surfaced via a new `GET /logs` endpoint. The frontend polls that endpoint every 3 seconds and renders a chronological, terminal-style log list.

After this phase, a developer can see the full raw message flow without looking at the terminal.

```text
Chat Window (existing)
──────────────────────────────
Message Log Panel (new)
  [INCOMING] 17:04:01  Hello
  [OUTGOING] 17:04:01  You said: Hello
  [INCOMING] 17:05:12  How are you?
  [OUTGOING] 17:05:12  You said: How are you?
```

---

## Decisions (from design interview)

| Decision | Choice | Rationale |
|---|---|---|
| Panel placement | Below the chat, always-visible, ~1/3 viewport height | Matches KICKSTART layout; keeps chat and log simultaneously visible |
| Log state ownership | Backend in-memory array, exposed via `GET /logs` | Source of truth is the server; mirrors what a real bot pipeline would log |
| Fetch strategy | Frontend polls `GET /logs` every 3 seconds | Simple, no WebSockets, no new dependencies |
| Display format | Unified chronological list with `INCOMING` / `OUTGOING` direction badge | Easiest to scan; matches KICKSTART spirit |
| Visual style | Terminal/console aesthetic — monospace, dark bg, muted badge colors | Signals "developer tool"; visually distinct from the chat UI |

---

## Current State

| File | Relevant Detail |
|---|---|
| `backend/src/index.ts` | Single file; `POST /message` logs to console only — no in-memory store |
| `frontend/src/App.tsx` | `chat-root` div contains `ChatHeader`, `MessageList`, `MessageInput` — log panel added as fourth child |
| `frontend/src/chat.css` | All existing styles; log panel styles will be appended |

---

## Proposed Changes

---

### Backend (`backend/src/`)

#### [MODIFY] `backend/src/index.ts`

**1. Define a `LogEntry` type and in-memory store**

```typescript
interface LogEntry {
  direction: 'INCOMING' | 'OUTGOING';
  message: string;
  userId: string;
  timestamp: string; // ISO 8601
}

const logs: LogEntry[] = [];
```

**2. Append to the log store inside `POST /message`**

After validation, before responding — push both the incoming message and the outgoing reply:

```typescript
const incoming: LogEntry = {
  direction: 'INCOMING',
  message: message.trim(),
  userId,
  timestamp: new Date().toISOString(),
};
logs.push(incoming);

const reply = `You said: ${message.trim()}`;

const outgoing: LogEntry = {
  direction: 'OUTGOING',
  message: reply,
  userId,
  timestamp: new Date().toISOString(),
};
logs.push(outgoing);

return res.json({ message: reply });
```

**3. Add `GET /logs` endpoint**

```typescript
app.get('/logs', (_req: Request, res: Response) => {
  res.json({ logs });
});
```

No pagination — all logs returned in insertion order.

---

### Frontend (`frontend/src/`)

#### [MODIFY] `frontend/src/App.tsx`

**1. Define a `LogEntry` type (mirrors backend)**

```tsx
interface LogEntry {
  direction: 'INCOMING' | 'OUTGOING';
  message: string;
  userId: string;
  timestamp: string;
}
```

**2. Add `logs` state and a polling `useEffect`**

```tsx
const [logs, setLogs] = useState<LogEntry[]>([]);

useEffect(() => {
  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:3001/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch {
      // silently ignore — backend may not be running yet
    }
  };

  fetchLogs(); // immediate first fetch
  const interval = setInterval(fetchLogs, 3000);
  return () => clearInterval(interval); // cleanup on unmount
}, []);
```

**3. Create a `LogPanel` inline component**

```tsx
interface LogPanelProps {
  logs: LogEntry[];
}

function LogPanel({ logs }: LogPanelProps) {
  return (
    <div className="log-panel" aria-label="Message Logs">
      <div className="log-panel-header">
        <span className="log-panel-title">Message Logs</span>
        <span className="log-panel-count">{logs.length} entries</span>
      </div>
      <div className="log-panel-body">
        {logs.length === 0 ? (
          <div className="log-empty">No messages logged yet.</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`log-entry log-entry--${entry.direction.toLowerCase()}`}>
              <span className="log-badge">{entry.direction}</span>
              <span className="log-time">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
              </span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**4. Add `<LogPanel>` to the `App` return, below `<MessageInput>`**

```tsx
return (
  <div className="chat-root">
    <ChatHeader />
    <MessageList messages={messages} messagesEndRef={messagesEndRef} isLoading={isLoading} />
    <MessageInput input={input} setInput={setInput} onSend={handleSend} />
    <LogPanel logs={logs} />
  </div>
);
```

---

#### [MODIFY] `frontend/src/chat.css`

Append the following terminal/console-style log panel styles:

```css
/* ── Log Panel ─────────────────────────────────────────── */

.log-panel {
  height: 33vh;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  background: #0d0d0f;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  flex-shrink: 0;
}

.log-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #111113;
}

.log-panel-title {
  color: #8888a0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.log-panel-count {
  color: #55556a;
  font-size: 10px;
}

.log-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.log-empty {
  color: #44445a;
  padding: 12px 14px;
  font-style: italic;
}

.log-entry {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 3px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background 0.1s;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.02);
}

.log-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  min-width: 72px;
  padding: 1px 5px;
  border-radius: 3px;
  text-align: center;
}

.log-entry--incoming .log-badge {
  color: #4db8ff;
  background: rgba(77, 184, 255, 0.1);
}

.log-entry--outgoing .log-badge {
  color: #7cfc94;
  background: rgba(124, 252, 148, 0.1);
}

.log-time {
  color: #55556a;
  min-width: 70px;
  flex-shrink: 0;
}

.log-message {
  color: #b0b0c8;
  word-break: break-word;
}
```

---

## File Map

```
backend/src/
└── index.ts          ← MODIFY  (LogEntry type, logs[], GET /logs, push to logs in POST /message)

frontend/src/
├── App.tsx           ← MODIFY  (LogEntry type, logs state, polling useEffect, LogPanel component)
└── chat.css          ← MODIFY  (log panel + entry styles appended)
```

No new npm packages. No new files.

---

## Verification Plan

### Pre-conditions

- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`

### Manual — Happy Path

1. Open `http://localhost:5173`.
2. Observe the log panel below the input — shows `"No messages logged yet."`.
3. Send a message `"Hello"`.
4. Within ~3 seconds, verify the log panel shows:
   - `[INCOMING]  HH:MM:SS  Hello`
   - `[OUTGOING]  HH:MM:SS  You said: Hello`
5. Send a second message — verify two more entries appear, in order.
6. Verify log entries accumulate (old entries remain visible).

### Manual — Backend Down

7. Stop the backend.
8. Verify: the log panel shows stale data silently (no crash, no user-facing error).

### Automated

```bash
cd frontend && npm run build
```

Build must complete with zero TypeScript errors.

```bash
curl http://localhost:3001/logs
```

Should return `{ "logs": [...] }`.

---

## Progress Checklist

### Backend — `index.ts`
- [x] Add `LogEntry` interface
- [x] Add `logs: LogEntry[]` in-memory array
- [x] Push `INCOMING` entry in `POST /message` (after validation)
- [x] Compute reply string, push `OUTGOING` entry
- [x] Return reply via `res.json({ message: reply })`
- [x] Add `GET /logs` endpoint returning `{ logs }`

### Frontend — `App.tsx`
- [x] Add `LogEntry` interface (mirrors backend)
- [x] Add `logs` state (`useState<LogEntry[]>([])`)
- [x] Add polling `useEffect` (immediate fetch + `setInterval(3000)` + cleanup)
- [x] Create `LogPanel` component (header, count, body, entries)
- [x] Render `<LogPanel logs={logs} />` below `<MessageInput>` in `App`

### Frontend — `chat.css`
- [x] Add `.log-panel` (height, flex, dark bg, border-top, monospace font)
- [x] Add `.log-panel-header` and title/count styles
- [x] Add `.log-panel-body` (scrollable)
- [x] Add `.log-empty` style
- [x] Add `.log-entry` row (flex, gap, hover)
- [x] Add `.log-badge` base + `--incoming` (blue) / `--outgoing` (green) variants
- [x] Add `.log-time` and `.log-message` styles

### Verification
- [x] Log panel visible below input on load
- [x] Entries appear within 3s of sending a message
- [x] INCOMING / OUTGOING badges display correctly
- [x] Timestamps show HH:MM:SS
- [x] Multiple messages accumulate correctly
- [x] Backend-down: panel shows stale data silently
- [x] `npm run build` passes with zero TypeScript errors
- [x] `curl http://localhost:3001/logs` returns correct JSON
