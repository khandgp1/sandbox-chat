# Phase 9: Developer Experience

## Background

Phases 1–8 are complete. The full message pipeline is working end-to-end:
- Frontend (React + Vite + TypeScript) on port 5173
- Backend (Express + TypeScript) on port 3001
- Bot engine, conversation memory, Telegram compatibility types all in place
- Root `npm run dev` already starts both services via `concurrently`

Phase 9 polishes the **developer experience** so any new developer can understand, configure, and boot the project in minutes.

---

## Decisions (resolved via /grill-me)

| Decision | Choice |
|---|---|
| README location | Root-level `README.md` (project-wide) + replace `frontend/README.md` with a Vite-specific one |
| Environment variables | Single root `.env` documenting `PORT` and `VITE_API_URL`; each package reads its own var |
| API config file | `frontend/src/config/api.ts` — frontend reads `VITE_API_URL` from env, falls back to `http://localhost:3001` |
| Linting | ESLint only — validate/confirm existing `frontend/eslint.config.js`, add ESLint to the backend |
| Startup | Root `npm run dev` (already wired) — document it as the canonical single command |

---

## Proposed Changes

### 1. README

#### [NEW] `README.md` (project root)

A comprehensive README covering:
- Project overview and purpose
- Stack (React/Vite/Express/TypeScript)
- Directory structure
- Prerequisites (`node >= 18`)
- Startup instructions (`npm install && npm run dev`)
- Port reference (frontend: 5173, backend: 3001)
- Available endpoints (`POST /message`, `GET /logs`, `GET /health`)
- Architecture diagram (text)
- Phase summary / what's implemented
- Out of scope callout

#### [MODIFY] `frontend/README.md`

Replace the generic Vite boilerplate README with a frontend-specific one that explains:
- What this package is (the sandbox chat UI)
- How to run standalone (`npm run dev` inside `/frontend`)
- How env var `VITE_API_URL` is consumed

---

### 2. Environment Variables

#### [NEW] `.env` (project root)

```dotenv
# Backend
PORT=3001

# Frontend (Vite reads VITE_* prefixed vars)
VITE_API_URL=http://localhost:3001
```

#### [NEW] `.env.example` (project root)

Same content as `.env` — committed to version control as a template so the `.env` itself can be gitignored.

#### [MODIFY] `.gitignore` (root)

Add `.env` to the root `.gitignore` (keep `.env.example` tracked).

---

### 3. API Configuration File

#### [NEW] `frontend/src/config/api.ts`

```typescript
// Central API configuration.
// In development, VITE_API_URL is set in the root .env file.
// Falls back to http://localhost:3001 for zero-config local development.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
```

#### [MODIFY] `frontend/src/App.tsx`

Replace both occurrences of the hardcoded `'http://localhost:3001'` string with `API_BASE_URL` imported from `./config/api`.

---

### 4. Linting

#### Validate `frontend/eslint.config.js`

The frontend already has ESLint configured via the Vite scaffold. Confirm it runs cleanly:
```bash
cd frontend && npx eslint src --ext ts,tsx
```

#### [NEW] `backend/.eslintrc.json`

Add a minimal ESLint config for the backend:
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "env": { "node": true, "es2022": true }
}
```

#### [MODIFY] `backend/package.json`

Add a `lint` script:
```json
"lint": "eslint src --ext ts"
```

Install dev dependencies:
```bash
cd backend && npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint
```

#### [MODIFY] `package.json` (root)

Add a root-level `lint` script that runs both:
```json
"lint": "npm run lint --prefix frontend && npm run lint --prefix backend"
```

---

### 5. Startup Instructions

The root `npm run dev` script already exists and uses `concurrently`. No script changes needed.

The README (item 1 above) will document:

```bash
# One-time setup
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start both services
npm run dev
```

---

## Checklist

- [ ] Create root `README.md`
- [ ] Replace `frontend/README.md` with project-specific content
- [ ] Create root `.env` with `PORT` and `VITE_API_URL`
- [ ] Create root `.env.example` (committed to git)
- [ ] Update root `.gitignore` to exclude `.env`
- [ ] Create `frontend/src/config/api.ts`
- [ ] Update `frontend/src/App.tsx` to import `API_BASE_URL` from config
- [ ] Add `backend/.eslintrc.json`
- [ ] Add `lint` script to `backend/package.json`
- [ ] Install ESLint dev deps in backend
- [ ] Add root `lint` script to root `package.json`
- [ ] Run `npx tsc --noEmit` in backend — no errors expected
- [ ] Run lint in both packages — no errors expected

---

## Verification Plan

### Automated

```bash
# TypeScript
cd backend && npx tsc --noEmit

# Linting
npm run lint   # from root — runs frontend + backend
```

### Manual

1. Run `npm run dev` from project root
2. Open `http://localhost:5173` — chat UI loads
3. Send a message — bot responds
4. Check `http://localhost:3001/health` — returns `{ "status": "ok" }`
5. Confirm a new developer could follow the README from scratch

---

## Out of Scope for Phase 9

- No database, auth, AI, or Telegram integration
- No production build pipeline
- No CI/CD configuration
