# 13_IMPLEMENTATION_.md

## Goal Description
Update the Sandbox Chat UI to include a simulated date controller in the header allowing the user to increment the date by +1 day. All messages (and the webhook payload sent to the bot) will carry the updated simulated date/time.

---

## Proposed Changes

### Frontend

#### [MODIFY] [App.tsx](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/frontend/src/App.tsx)
- Define a top-level helper `formatMessageTimestamp(dateStr: string)` that formats any ISO date string to `"MMM D, HH:MM"` (e.g., `"Jun 18, 15:08"`).
- Update the `MessageBubble` component to format the timestamp using `formatMessageTimestamp`.
- Update `ChatHeader` props to accept `simulatedDate` and `onIncrementDate`. Render the current simulated date and a `+1 Day` button in the center.
- In the main `App` component:
  - Add state `dateOffsetDays` (initially `0`) to represent the offset.
  - Keep a ref `dateOffsetDaysRef` pointing to `dateOffsetDays` to avoid stale closures in the polling interval.
  - Implement `getSimulatedDate()` which returns a new `Date` object advanced by `dateOffsetDaysRef.current` days.
  - Update `handleSend` and the polling hook to store and send the ISO string returned by `getSimulatedDate().toISOString()`.
  - Pass `timestamp` in the body of `POST /message`.

#### [MODIFY] [chat.css](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/frontend/src/chat.css)
- Add CSS styling for the `.chat-header-simulated-date` wrapper, `.simulated-date-label`, `.simulated-date-value`, and `.increment-date-btn`.

### Backend

#### [MODIFY] [index.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/backend/src/index.ts)
- Modify the `POST /message` handler to read `timestamp` from the request body. If present and valid, use it for the constructed `ChatMessage` object instead of generating a new current server timestamp.

---

## Verification Plan

### Manual Verification
1. Run the backend and frontend dev servers.
2. Verify that the UI header displays "Simulated Date: <Current Date>".
3. Send a message and check that the bubble shows the current date/time in the format `"Jun 18, 15:08"`.
4. Click the `+1 Day` button in the header. Verify the header updates to show the date of tomorrow.
5. Send a new message. Verify that:
   - The message bubble in the UI shows tomorrow's date.
   - The outgoing webhook payload (checked via the receiver log or intercepting) includes the `timestamp` set to tomorrow.
   - The log panel shows the message with tomorrow's date.

---

## Checklist
- [x] Modify `backend/src/index.ts` to accept and use `timestamp` from the request body
- [x] Modify `frontend/src/chat.css` to add simulated date styling in the header
- [x] Modify `frontend/src/App.tsx` to handle simulated date state, incrementing, and formatting
- [x] Verify frontend build (`npm run build` or `npm run lint`) has no TypeScript/ESLint errors
- [x] Manually verify sending messages with/without the date incremented works end-to-end
