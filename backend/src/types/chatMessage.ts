export type ChatMessage = {
  userId: string;
  text: string;
  timestamp: string; // ISO 8601
};

export type BotReply = {
  text: string;
  timestamp: string; // ISO 8601
};
