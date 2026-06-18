# 11_IMPLEMENTATION_.md

## Goal Description
Completely remove the `history` field from the outgoing webhook payload sent from the sandbox chat backend to the bot webhook server, ensuring that only `userId` and `message` are posted.

---

## Proposed Changes

### Backend

#### [MODIFY] [index.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/index.ts)
- Modify the body of the `fetch` call to the `BOT_WEBHOOK_URL` in the `POST /message` endpoint to exclude the `history` property.

---

## Verification Plan

### Manual Verification
- Run the backend and frontend servers: `npm run dev` at the root.
- Configure a dummy or local bot server webhook (e.g. `http://localhost:4000/webhook` or inspect the outbound network requests).
- Send a message (e.g. `"GM"`) from the Sandbox UI.
- Verify that the HTTP request payload sent to the bot webhook only contains:
  ```json
  {
    "userId": "sandbox-user",
    "message": "GM"
  }
  ```
  and does not include the `"history"` field.

---

## Checklist
- [x] Modify `backend/src/index.ts` to remove `history` from the `BOT_WEBHOOK_URL` fetch payload
- [x] Verify that server starts and compiles without TypeScript/ESLint errors
- [x] Manually verify webhook payload no longer sends the history
