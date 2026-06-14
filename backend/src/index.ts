import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateReply } from './services/botEngine';


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
  const incoming: LogEntry = {
    direction: 'INCOMING',
    message: message.trim(),
    userId,
    timestamp: new Date().toISOString(),
  };
  logs.push(incoming);

  // Compute response
  const reply = generateReply(message);

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

