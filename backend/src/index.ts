import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateReply } from './services/botEngine';
import { getHistory, appendMessage } from './services/conversationStore';
import { ChatMessage, BotReply } from './types/chatMessage';


const app = express();
const PORT = 3001;

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
app.post('/message', (req: Request, res: Response) => {
  const { userId, message } = req.body;

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
    timestamp: new Date().toISOString(),
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

  // Fetch history before generating the reply
  const history = getHistory(chatMessage.userId);

  // Compute response
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

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

