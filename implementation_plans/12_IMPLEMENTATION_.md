# 12_IMPLEMENTATION_.md

## Goal Description
Add the message timestamp (`timestamp`) to the webhook payload sent from the sandbox chat backend to the bot webhook server, so that the bot receives the date/time info of the message.

---

## Proposed Changes

### Backend

#### [MODIFY] [index.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/index.ts)
- Modify the JSON payload in the `fetch` call to `BOT_WEBHOOK_URL` to include the `timestamp` field.

---

## Verification Plan

### Manual Verification
1. Run the backend and frontend servers using `npm run dev` at the project root.
2. In another terminal or inspect panel, check the outgoing request sent to the configured `BOT_WEBHOOK_URL`.
3. Send a message (e.g. `"GM"`) from the Sandbox UI.
4. Verify that the webhook request body now contains:
   ```json
   {
     "userId": "sandbox-user",
     "message": "GM",
     "timestamp": "2026-06-18T14:58:43.000Z"
   }
   ```

---

## Checklist
- [x] Modify `backend/src/index.ts` to add `timestamp` to the `BOT_WEBHOOK_URL` fetch payload
- [x] Verify that server starts and compiles without TypeScript/ESLint errors
- [x] Manually verify webhook payload includes the timestamp field with an ISO 8601 string
