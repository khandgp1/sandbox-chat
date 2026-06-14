import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
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

  // Log
  console.log(`[POST /message] userId=${userId} | message="${message}"`);

  // Respond
  return res.json({ message: `You said: ${message.trim()}` });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

