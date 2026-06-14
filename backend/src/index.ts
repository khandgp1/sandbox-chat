import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateReply } from './services/botEngine';
import { getHistory, appendMessage } from './services/conversationStore';


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

  // Log to console
  console.log(`[POST /message] userId=${userId} | message="${message}"`);

  // Log incoming message in memory
  const timestamp = new Date().toISOString();
  const incoming: LogEntry = {
    direction: 'INCOMING',
    message: message.trim(),
    userId,
    timestamp,
  };
  logs.push(incoming);

  // Fetch history before generating the reply
  const history = getHistory(userId);

  // Compute response
  const reply = generateReply(message, history);

  // Store message and response in conversation history
  appendMessage(userId, { role: 'user', text: message.trim(), timestamp });
  appendMessage(userId, { role: 'bot', text: reply, timestamp: new Date().toISOString() });

  // Log outgoing response in memory
  const outgoing: LogEntry = {
    direction: 'OUTGOING',
    message: reply,
    userId,
    timestamp: new Date().toISOString(),
  };
  logs.push(outgoing);

  // Respond
  return res.json({ message: reply });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

