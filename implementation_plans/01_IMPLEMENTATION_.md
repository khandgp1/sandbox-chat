# 01 — Phase 2: Backend Message API

## Goal

Add a `POST /message` endpoint to the existing Express backend.
The endpoint accepts a user message, validates the payload, logs the request, and returns an echo-style bot reply.
No frontend changes. Verified with `curl`.

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| CORS | Add `cors` middleware now | Avoids a surprise blocker in Phase 4 when the UI calls the backend |
| Route location | Keep handler in `src/index.ts` | Phase 2 is still small; route extraction is Phase 6's job |
| Request logging | `console.log` inside the handler | Dead simple; structured logging deferred to Phase 9 |
| Bot reply format | `"You said: <message>"` | Proves the full payload round-trips correctly |
| Validation | 400 if `userId` or `message` is missing/empty | Matches KICKSTART spec intent; userId required so Phase 7 memory works cleanly |
| Error shape | `{ "error": "..." }` | Consistent error envelope |

---

## Proposed Changes

### Backend (`backend/`)

#### [MODIFY] `backend/package.json`

Add `cors` as a runtime dependency:

```json
"dependencies": {
  "cors": "^2.8.5",
  "express": "..."
}
```

Add `@types/cors` as a dev dependency:

```json
"devDependencies": {
  "@types/cors": "^2.8.17",
  ...
}
```

---

#### [MODIFY] `backend/src/index.ts`

Full updated file content:

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// POST /message
app.post('/message', (req: Request, res: Response) => {
  const { userId, message } = req.body;

  // Validate
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  // Log
  console.log(`[POST /message] userId=${userId} | message="${message}"`);

  // Respond
  return res.json({ message: `You said: ${message.trim()}` });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
```

---

## Verification Plan

### Automated
- `npm install` in `backend/` succeeds with `cors` and `@types/cors`
- `ts-node-dev` compiles without TypeScript errors

### Manual — `curl` test suite

**Happy path:**
```bash
curl -s -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"sandbox-user","message":"Hello"}' | jq
# Expected: { "message": "You said: Hello" }
```

**Missing message:**
```bash
curl -s -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"sandbox-user","message":""}' | jq
# Expected: { "error": "message is required" }
```

**Missing userId:**
```bash
curl -s -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' | jq
# Expected: { "error": "userId is required" }
```

**Empty body:**
```bash
curl -s -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{}' | jq
# Expected: { "error": "userId is required" }
```

**CORS check (simulates browser preflight):**
```bash
curl -s -I -X OPTIONS http://localhost:3001/message \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
# Expected: Access-Control-Allow-Origin header present
```

---

## Progress Checklist

### Dependencies
- [x] Install `cors` + `@types/cors` in `backend/`

### Endpoint
- [x] Add `cors` middleware to `src/index.ts`
- [x] Add `POST /message` route to `src/index.ts`
- [x] Validate `userId` (missing/empty → 400)
- [x] Validate `message` (missing/empty → 400)
- [x] Add `console.log` request logging
- [x] Return `{ message: "You said: <message>" }` on success

### Verification
- [x] Backend starts without TypeScript errors
- [x] Happy path `curl` returns echo response
- [x] Missing `message` returns 400
- [x] Missing `userId` returns 400
- [x] Empty body returns 400
- [x] CORS header present on OPTIONS preflight
