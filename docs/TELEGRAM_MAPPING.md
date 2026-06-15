# Telegram Compatibility Layer Mapping Documentation

This document describes how the standard Telegram `Update` object payload corresponds to the internal `ChatMessage` model used in our local Sandbox Chat.

## Data Type Definitions

### 1. Internal models (backend/src/types/chatMessage.ts)
```typescript
export type ChatMessage = {
  userId: string;
  text: string;
  timestamp: string; // ISO 8601
};

export type BotReply = {
  text: string;
  timestamp: string; // ISO 8601
};
```

---

## Field Mapping Strategy

A future Telegram integration will receive message payloads via Webhook (an `Update` object). Below is the mapping table showing how fields map to the internal `ChatMessage` type.

| ChatMessage Field | Target JSON Path (Telegram Update payload) | Explanation / Transformation |
| :--- | :--- | :--- |
| `userId` | `update.message.from.id` (as string) | Telegram user IDs are numeric values. Convert to a string representation to uniquely identify the caller. |
| `text` | `update.message.text` | Retrieve raw message contents (text message). |
| `timestamp` | `update.message.date` (Unix epoch timestamp) | Convert Telegram's Unix timestamp to a standardized ISO 8601 string using `new Date(date * 1000).toISOString()`. |

### Future Telegram Response Mapping

To send a reply back to the Telegram client:
- Call `botEngine.generateReply(chatMessage, history)`.
- The bot engine returns a `BotReply` object containing `{ text, timestamp }`.
- Send this output to Telegram using the bot API:
  - **Method**: `POST https://api.telegram.org/bot<token>/sendMessage`
  - **Request Body**:
    ```json
    {
      "chat_id": "<userId from ChatMessage>",
      "text": "<text from BotReply>"
    }
    ```
