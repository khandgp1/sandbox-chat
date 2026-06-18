import { useState, useRef, useEffect } from 'react';
import './App.css';
import './chat.css';

import { API_BASE_URL } from './config/api';

// Types
interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string; // HH:MM
}

interface LogEntry {
  direction: 'INCOMING' | 'OUTGOING';
  message: string;
  userId: string;
  timestamp: string; // ISO string
}

// Sub-components

// ChatHeader component
interface ChatHeaderProps {
  simulatedDate: Date;
  onIncrementDate: () => void;
}

function ChatHeader({ simulatedDate, onIncrementDate }: ChatHeaderProps) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${months[simulatedDate.getMonth()]} ${simulatedDate.getDate()}, ${simulatedDate.getFullYear()}`;

  return (
    <header className="chat-header">
      <div className="chat-header-info">
        <h1 className="chat-header-title">Sandbox Chat</h1>
        <div className="chat-header-status">
          <span className="status-dot"></span>
          <span>bot • online</span>
        </div>
      </div>
      <div className="chat-header-simulated-date">
        <span className="simulated-date-label">Simulated Date:</span>
        <span className="simulated-date-value">{formattedDate}</span>
        <button className="increment-date-btn" onClick={onIncrementDate} aria-label="Increment date by 1 day">
          +1 Day
        </button>
      </div>
      <div className="chat-header-actions">
        <span>Telegram Sandbox</span>
      </div>
    </header>
  );
}

function formatMessageTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

// MessageBubble component
interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--bot'}`}>
      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
        <div>{message.text}</div>
        <div className="bubble-meta">
          <span>{formatMessageTimestamp(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// TypingIndicator component
function TypingIndicator() {
  return (
    <div className="message-row message-row--bot">
      <div className="bubble bubble--bot typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

// MessageList component
interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
}

function MessageList({ messages, messagesEndRef, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🤖</div>
        <h2 className="empty-state-title">No messages yet</h2>
        <p className="empty-state-desc">
          Send a message to start simulating your chatbot interaction.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}

// MessageInput component
interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
}

function MessageInput({ input, setInput, onSend }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper">
        <textarea
          className="chat-input"
          placeholder="Write a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </div>
      <button 
        className="send-btn" 
        onClick={onSend}
        disabled={!input.trim()}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}



// LogPanel component
interface LogPanelProps {
  logs: LogEntry[];
}

function LogPanel({ logs }: LogPanelProps) {
  return (
    <div className="log-panel" aria-label="Message Logs">
      <div className="log-panel-header">
        <span className="log-panel-title">Message Logs</span>
        <span className="log-panel-count">{logs.length} entries</span>
      </div>
      <div className="log-panel-body">
        {logs.length === 0 ? (
          <div className="log-empty">No messages logged yet.</div>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`log-entry log-entry--${entry.direction.toLowerCase()}`}>
              <span className="log-badge">{entry.direction}</span>
              <span className="log-time">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
              </span>
              <span className="log-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated date offset state
  const [dateOffsetDays, setDateOffsetDays] = useState(0);
  const dateOffsetDaysRef = useRef(dateOffsetDays);

  useEffect(() => {
    dateOffsetDaysRef.current = dateOffsetDays;
  }, [dateOffsetDays]);

  const getSimulatedDate = (): Date => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffsetDays);
    return d;
  };

  const handleIncrementDate = () => {
    setDateOffsetDays((prev) => prev + 1);
  };

  // Polling logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/logs`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
        }
      } catch {
        // silently ignore — backend may not be running yet
      }
    };

    fetchLogs(); // immediate first fetch
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Poll for async bot replies (Webhook Relay Mode)
  useEffect(() => {
    const pollForReply = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/incoming-reply?userId=sandbox-user`);
        if (res.ok) {
          const data = await res.json();
          if (data.message) {
            const replyDate = new Date();
            replyDate.setDate(replyDate.getDate() + dateOffsetDaysRef.current);

            const botMessage: Message = {
              id: Date.now(),
              sender: 'bot',
              text: data.message,
              timestamp: replyDate.toISOString(),
            };
            setMessages((prev) => [...prev, botMessage]);
          }
        }
      } catch {
        // silently ignore
      }
    };

    const interval = setInterval(pollForReply, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const timestamp = getSimulatedDate().toISOString();
    const userMsgId = Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: trimmedInput,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'sandbox-user',
          message: trimmedInput,
          timestamp,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.message) {
        const newBotMessage: Message = {
          id: Date.now(),
          sender: 'bot',
          text: data.message,
          timestamp: getSimulatedDate().toISOString(),
        };
        setMessages((prev) => [...prev, newBotMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const newBotMessage: Message = {
        id: Date.now(),
        sender: 'bot',
        text: '⚠️ Failed to reach the bot. Try again.',
        timestamp: getSimulatedDate().toISOString(),
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-root">
      <ChatHeader simulatedDate={getSimulatedDate()} onIncrementDate={handleIncrementDate} />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} isLoading={isLoading} />
      <MessageInput input={input} setInput={setInput} onSend={handleSend} />
      <LogPanel logs={logs} />
    </div>
  );
}

export default App;
