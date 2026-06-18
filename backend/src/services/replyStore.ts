// Pending reply slots: one per userId.
// The newest reply overwrites any unread one.

const pendingReplies = new Map<string, string>();

export function storePendingReply(userId: string, message: string): void {
  pendingReplies.set(userId, message);
}

export function consumePendingReply(userId: string): string | null {
  const reply = pendingReplies.get(userId) ?? null;
  if (reply !== null) {
    pendingReplies.delete(userId);
  }
  return reply;
}
