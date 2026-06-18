# Phase 10: Webhook Relay Mode Implementation Plan

This plan details the implementation of **Webhook Relay Mode** for `sandbox-chat`, allowing it to act as a local test harness for an external bot algorithm project.

---

## Decisions & Configuration

Following the `/grill-me` alignment, the design decisions are:
1. **Loading State / Typing Indicator**: The UI's loading state is turned off immediately after the sandbox successfully acknowledges a message (`POST /message` completes and returns `{ status: 'forwarded' }`). No typing indicator is visible while the external bot processes.
2. **Error Handling**: If the external bot server is down or returns an error on `POST BOT_WEBHOOK_URL`, the sandbox backend returns `502 Bad Gateway` to the frontend UI, allowing the UI to display the standard error alert ("Failed to reach the bot").
3. **Environment Variables**: The backend will install and use the `dotenv` package to load the `BOT_WEBHOOK_URL` environment variable from the `.env` file.

---

## Proposed Changes

### 1. Backend Dependencies
- Install `dotenv` package in the `backend` project.

### 2. Backend — `backend/src/`

#### [NEW] [replyStore.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/services/replyStore.ts)
A simple in-memory store for pending bot replies, keyed by `userId`.
- Expose `storePendingReply(userId: string, message: string): void`
- Expose `consumePendingReply(userId: string): string | null`

#### [MODIFY] [index.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/index.ts)
- Initialize `dotenv` at the top of the file.
- Read `BOT_WEBHOOK_URL` from `process.env`.
- Modify `POST /message` endpoint:
  - If `BOT_WEBHOOK_URL` is set:
    - Log incoming user message.
    - Post payload `{ userId, message, history }` to `BOT_WEBHOOK_URL`.
    - If the request fails (catch error), log the error and return `502 Bad Gateway` to frontend.
    - If the request succeeds, save the user message to `conversationStore` and return `200 OK` with `{ status: 'forwarded' }`.
  - If `BOT_WEBHOOK_URL` is not set:
    - Run the existing synchronous bot engine flow.
- Add `POST /incoming-reply` endpoint:
  - Expects `{ userId: string, message: string }`.
  - Stores the message using `replyStore.storePendingReply`.
  - Appends the bot's reply to `conversationStore` with `role: 'bot'`.
  - Logs the reply as an `OUTGOING` log entry.
  - Returns `200 OK`.
- Add `GET /incoming-reply` endpoint:
  - Expects query param `?userId=` (defaults to `"sandbox-user"`).
  - Retrieves and clears any pending reply using `replyStore.consumePendingReply`.
  - Returns `{ message: string | null }`.

### 3. Frontend — `frontend/src/`

#### [MODIFY] [App.tsx](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/frontend/src/App.tsx)
- Add a React `useEffect` hook that polls `GET /incoming-reply?userId=sandbox-user` every 1000ms.
- When a non-null message is fetched, append it to the `messages` state as a bot message.
- Modify `handleSend`:
  - Only append the bot's reply from the `POST /message` response if `data.message` is present (truthy). If absent (status: `forwarded`), do not append anything immediately.

### 4. Environment Config

#### [MODIFY] [.env.example](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/.env.example)
Add commented-out example of `BOT_WEBHOOK_URL`.

#### [MODIFY] [.env](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/.env)
Add `BOT_WEBHOOK_URL=http://localhost:4000/webhook`.

---

## Verification Plan

### Automated
1. Run `cd backend && npx tsc --noEmit` to verify type checking.
2. Run `npm run lint` from the root directory.

### Manual
1. **Fallback Mode regression check**:
   - Comment out `BOT_WEBHOOK_URL` in `.env`.
   - Send a message in the UI → verify response appears synchronously.
2. **Webhook Relay Mode check**:
   - Set `BOT_WEBHOOK_URL=http://localhost:4000/webhook` in `.env`.
   - Set up a dummy bot receiver that listens on port 4000 and POSTs back to sandbox's `/incoming-reply` endpoint.
   - Send a message in the UI → verify that UI does not respond synchronously but shows the response asynchronously after polling.
   - Stop the dummy bot receiver → verify that sending a message displays the "Failed to reach the bot" error banner.
