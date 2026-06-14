# 00 — Phase 1: Project Setup

## Goal

Scaffold a runnable React + Vite + TypeScript **frontend** and an Express + TypeScript **backend**, wired together with a single root `npm run dev` command.

This is the foundation for all subsequent phases. No business logic is introduced here — only working, bootable apps.

---

## Decisions Made

| Decision | Choice |
|---|---|
| Frontend port | `5173` (Vite default) |
| Backend port | `3001` |
| Package manager | `npm` |
| Backend TS runner | `ts-node-dev` |
| Root orchestration | `concurrently` via root `package.json` |
| Root `.gitignore` | Yes — `node_modules`, `dist`, `.env` |

---

## Proposed Changes

### Root Level

#### [NEW] `package.json`
Root workspace orchestrator. Installs `concurrently` as a dev dependency and exposes:
```json
"scripts": {
  "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\""
}
```

#### [NEW] `.gitignore`
Covers:
- `node_modules/`
- `dist/`
- `.env`
- `*.local`

---

### Frontend (`frontend/`)

#### [NEW] `frontend/` — Vite + React + TypeScript project
Bootstrapped via:
```bash
npx create-vite@latest frontend --template react-ts
```

Key config:
- `vite.config.ts` — set `server.port` to `5173` (already the default, made explicit)
- Keep boilerplate minimal; clear default App content to a blank shell

Files created by scaffolding:
```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    └── App.tsx         ← cleared to blank shell
```

---

### Backend (`backend/`)

#### [NEW] `backend/` — Express + TypeScript project
Manually scaffolded (no CLI generator needed):

```
backend/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts        ← Express app, listens on port 3001
```

**`package.json` scripts:**
```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc"
}
```

**`src/index.ts`** (minimal starter):
```typescript
import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

**Dependencies:**
```
express
```

**Dev Dependencies:**
```
typescript
ts-node-dev
@types/express
@types/node
```

---

## Verification Plan

### Automated
- `npm install` succeeds in all three locations (root, frontend, backend)
- `npm run dev` at root starts both processes without errors

### Manual
- [x] Frontend: open `http://localhost:5173` — page loads in browser
- [x] Backend: `curl http://localhost:3001/health` → `{ "status": "ok" }`
- [x] No TypeScript errors on startup
- [x] Killing root `npm run dev` stops both processes

---

## Progress Checklist

### Setup
- [x] Create `implementation_plans/` folder ✅ (this file)
- [x] Create root `.gitignore`
- [x] Create root `package.json` with `concurrently`

### Frontend
- [x] Scaffold frontend with `create-vite` (`react-ts` template)
- [x] Confirm `vite.config.ts` has explicit port `5173`
- [x] Clear `App.tsx` to a blank shell
- [x] `npm install` in `frontend/`
- [x] Verify frontend starts (`npm run dev` in `frontend/`)

### Backend
- [x] Create `backend/` folder structure manually
- [x] Create `backend/package.json` with correct scripts + dependencies
- [x] Create `backend/tsconfig.json`
- [x] Create `backend/src/index.ts` with Express + `/health` route
- [x] `npm install` in `backend/`
- [x] Verify backend starts and `/health` responds

### Integration
- [x] `npm install` at root (installs `concurrently`)
- [x] `npm run dev` at root starts both apps
- [x] Both pass verification tests above
