# 02 — Phase 3: Chat UI

## Goal

Build a single-user, Telegram-inspired chat interface in the React/Vite/TypeScript frontend.

Phase 3 is **UI-only** — no backend calls yet (that is Phase 4's scope). Bot replies are hardcoded mocks.
The result is a fully styled, interactive chat window that a developer can open in the browser and type messages into.

---

## Decisions (from design interview)

| Decision | Choice | Rationale |
|---|---|---|
| Visual style | Telegram-inspired dark theme, glassmorphism bubbles | Matches the "fake Telegram client" concept in KICKSTART.md |
| Component structure | Single `App.tsx` with inline sub-components | Sandbox scope; extract into separate files in a later phase if needed |
| Existing files | Replace `App.tsx` entirely; replace `App.css` entirely | Both are bare Vite scaffolding placeholders with no real content |
| `index.css` | Extend / replace CSS variables to match new dark theme | Keep global resets, update colour tokens |
| Styling | New `chat.css` for all chat-specific rules | Vanilla CSS, zero new dependencies, matches project philosophy |
| Bot reply (Phase 3) | Hardcoded mock: `"Hello from the bot 🤖"` | Phase 4 will swap this for a real `POST /message` call |
| Message send trigger | Enter key **or** Send button click | Standard chat UX |
| Auto-scroll | Instant scroll to bottom on every new message | Simple `scrollIntoView()` via a `useRef` on the last message |

---

## Proposed Changes

### Frontend (`frontend/src/`)

#### [MODIFY] `frontend/src/index.css`

- Replace CSS custom-property tokens with a Telegram-dark palette:
  - Background: deep charcoal (`#17212b`)
  - Surface (chat area): slightly lighter (`#1c2733`)
  - User bubble: Telegram blue (`#2b5278`)
  - Bot bubble: dark panel (`#242f3d`)
  - Accent: bright blue (`#5288c1`)
  - Text: near-white (`#e8eaed`)
- Keep global resets (`body { margin: 0 }`, `box-sizing`, `font-smoothing`).
- Import Google Font **Inter** for modern typography.

#### [MODIFY] `frontend/src/App.tsx`

Full replacement with inline sub-components:

```tsx
// Types
type Message = {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string; // HH:MM
};

// Sub-components (defined in same file):
//   <ChatHeader />         — top bar ("Sandbox Bot", green "online" dot)
//   <MessageList />        — scrollable area, renders <MessageBubble> per message
//   <MessageBubble />      — single bubble, right-aligned for user, left for bot
//   <MessageInput />       — controlled textarea + send button

// App state (useState):
//   messages: Message[]   — conversation history (starts empty)
//   input: string          — current textarea value

// Behaviour:
//   sendMessage():
//     1. Guard: ignore empty input
//     2. Append user Message to messages[]
//     3. Append hardcoded bot reply: "Hello from the bot 🤖"
//     4. Clear input
//   Auto-scroll: useRef + useEffect watches messages.length → scrollIntoView()
//   Enter key handler: sendMessage() on Enter (not Shift+Enter)
```

#### [MODIFY] `frontend/src/App.css`

Full replacement — remove all Vite defaults. This file can be emptied since all styles move to `chat.css`.

#### [NEW] `frontend/src/chat.css`

All chat-specific styles. Key sections:

```
.chat-root          — full-viewport dark background, flex column
.chat-header        — top bar with app name, "online" dot, subtle border
.chat-messages      — flex-grow scrollable message area, padding
.message-row        — flex row, justify-content: flex-end for user, flex-start for bot
.bubble             — rounded pill/bubble, max-width 65%, padding, word-break
.bubble--user       — Telegram blue background
.bubble--bot        — dark panel background
.bubble-meta        — timestamp, small font, right-aligned
.chat-input-area    — sticky bottom bar, flex row
.chat-input         — textarea, dark bg, no border glow, auto-resize hint
.send-btn           — circular icon button, Telegram blue, hover scale micro-animation
```

Glassmorphism effects on the header and input bar via `backdrop-filter: blur(...)` and semi-transparent backgrounds.

---

## File Map

```
frontend/src/
├── index.css        ← MODIFY  (new dark theme tokens)
├── App.tsx          ← MODIFY  (full replacement — new Chat UI)
├── App.css          ← MODIFY  (clear Vite defaults)
└── chat.css         ← NEW     (all chat-specific styles)
```

No new npm packages required.

---

## Verification Plan

### Manual — Browser

1. `cd frontend && npm run dev` (or `npm run dev` from root if workspace script exists)
2. Open `http://localhost:5173`
3. Verify:
   - Dark Telegram-style background renders
   - Chat header shows "Sandbox Bot" + green online dot
   - Input field is visible at the bottom
   - Typing a message and pressing **Enter** appends a user bubble (right-aligned, blue)
   - Bot reply `"Hello from the bot 🤖"` appears immediately after (left-aligned, dark panel)
   - Chat window auto-scrolls to the latest message
   - Clicking the **Send** button also sends the message
   - Sending an empty message does nothing
   - Timestamps appear on each bubble (HH:MM)
   - No console errors

### Automated

- `npm run build` in `frontend/` completes without TypeScript or Vite errors.

---

## Progress Checklist

### Setup
- [ ] Update CSS tokens in `index.css` (dark Telegram palette + Inter font import)
- [ ] Clear `App.css` of all Vite defaults

### Chat styles (`chat.css`)
- [ ] Create `chat.css`
- [ ] `.chat-root` — full viewport, flex column, dark bg
- [ ] `.chat-header` — top bar, name, online dot, glassmorphism
- [ ] `.chat-messages` — scrollable flex container
- [ ] `.message-row` — alignment per sender
- [ ] `.bubble` + `.bubble--user` + `.bubble--bot` — rounded bubbles, colours
- [ ] `.bubble-meta` — timestamp
- [ ] `.chat-input-area` — sticky footer, glassmorphism
- [ ] `.chat-input` — styled textarea
- [ ] `.send-btn` — circular send button, hover micro-animation

### App.tsx — Components
- [ ] Define `Message` type
- [ ] `<ChatHeader />` inline component
- [ ] `<MessageBubble />` inline component (renders bubble + timestamp)
- [ ] `<MessageList />` inline component (maps messages → bubbles)
- [ ] `<MessageInput />` inline component (textarea + send button)

### App.tsx — Logic
- [ ] `messages` state (`useState<Message[]>`)
- [ ] `input` state (`useState<string>`)
- [ ] `sendMessage()` function:
  - [ ] Guard empty input
  - [ ] Append user message
  - [ ] Append hardcoded bot reply
  - [ ] Clear input
- [ ] Enter key handler (no Shift+Enter newline)
- [ ] Auto-scroll: `useRef` on bottom anchor + `useEffect` on `messages`

### Verification
- [x] Dev server starts without errors
- [x] Telegram-dark UI renders in browser
- [x] User bubble appears on send (right, blue)
- [x] Bot bubble appears immediately after (left, dark)
- [x] Auto-scroll works
- [x] Empty input is ignored
- [x] Timestamps visible
- [x] `npm run build` passes (no TS errors)
