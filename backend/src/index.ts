import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateReply } from './services/botEngine';
import { getHistory, appendMessage } from './services/conversationStore';
import { storePendingReply, consumePendingReply } from './services/replyStore';
import path from 'path';
import { ChatMessage, BotReply } from './types/chatMessage';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BOT_WEBHOOK_URL = process.env.BOT_WEBHOOK_URL ?? null;


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

interface LogEntry {
  direction: 'INCOMING' | 'OUTGOING';
  message: string;
  userId: string;
  timestamp: string; // ISO 8601
}

const logs: LogEntry[] = [];

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// GET /logs
app.get('/logs', (_req: Request, res: Response) => {
  res.json({ logs });
});

// POST /message
app.post('/message', async (req: Request, res: Response) => {
  const { userId, message, timestamp } = req.body;

  // Validate
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  // Construct standardized ChatMessage
  const chatMessage: ChatMessage = {
    userId,
    text: message.trim(),
    timestamp: typeof timestamp === 'string' && timestamp ? timestamp : new Date().toISOString(),
  };

  // Log to console
  console.log(`[POST /message] userId=${chatMessage.userId} | message="${chatMessage.text}"`);

  // Log incoming message in memory
  const incoming: LogEntry = {
    direction: 'INCOMING',
    message: chatMessage.text,
    userId: chatMessage.userId,
    timestamp: chatMessage.timestamp,
  };
  logs.push(incoming);

  // Fetch history before generating/forwarding the reply
  const history = getHistory(chatMessage.userId);

  if (BOT_WEBHOOK_URL) {
    try {
      const webhookResponse = await fetch(BOT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: chatMessage.userId,
          message: chatMessage.text,
          timestamp: chatMessage.timestamp,
        }),
      });

      if (!webhookResponse.ok) {
        console.error(`[POST /message] Webhook error: Bot server returned status ${webhookResponse.status}`);
        return res.status(502).json({ error: 'Failed to reach the bot server.' });
      }
    } catch (error) {
      console.error('[POST /message] Webhook error:', error);
      return res.status(502).json({ error: 'Failed to reach the bot server.' });
    }

    // Store user message in conversation history
    appendMessage(chatMessage.userId, { role: 'user', ...chatMessage });

    return res.json({ status: 'forwarded' });
  }

  // Fallback mode: Compute response synchronously
  const reply: BotReply = generateReply(chatMessage, history);

  // Store message and response in conversation history
  appendMessage(chatMessage.userId, { role: 'user', ...chatMessage });
  appendMessage(chatMessage.userId, {
    role: 'bot',
    userId: chatMessage.userId,
    text: reply.text,
    timestamp: reply.timestamp,
  });

  // Log outgoing response in memory
  const outgoing: LogEntry = {
    direction: 'OUTGOING',
    message: reply.text,
    userId: chatMessage.userId,
    timestamp: reply.timestamp,
  };
  logs.push(outgoing);

  // Respond
  return res.json({ message: reply.text });
});

// POST /incoming-reply
app.post('/incoming-reply', (req: Request, res: Response) => {
  const { userId, message } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  const timestamp = new Date().toISOString();

  // Log outgoing response in memory
  const outgoing: LogEntry = {
    direction: 'OUTGOING',
    message: message.trim(),
    userId,
    timestamp,
  };
  logs.push(outgoing);

  // Store message in conversation history
  appendMessage(userId, {
    role: 'bot',
    userId,
    text: message.trim(),
    timestamp,
  });

  // Store in replyStore for polling
  storePendingReply(userId, message.trim());

  console.log(`[POST /incoming-reply] Received reply for userId=${userId} | message="${message.trim()}"`);

  return res.sendStatus(200);
});

// GET /incoming-reply
app.get('/incoming-reply', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'sandbox-user';
  const message = consumePendingReply(userId);
  return res.json({ message });
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

