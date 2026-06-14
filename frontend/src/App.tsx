import { useState, useRef, useEffect } from 'react';
import './App.css';
import './chat.css';

// Types
interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string; // HH:MM
}

// Sub-components

// ChatHeader component
function ChatHeader() {
  return (
    <header className="chat-header">
      <div className="chat-header-info">
        <h1 className="chat-header-title">Sandbox Chat</h1>
        <div className="chat-header-status">
          <span className="status-dot"></span>
          <span>bot • online</span>
        </div>
      </div>
      <div className="chat-header-actions">
        <span>Telegram Sandbox</span>
      </div>
    </header>
  );
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
          <span>{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
}

// MessageList component
interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function MessageList({ messages, messagesEndRef }: MessageListProps) {
  if (messages.length === 0) {
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

// Main App Component
function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const userMsgId = Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: trimmedInput,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');

    // Trigger mock bot reply
    setTimeout(() => {
      const botTimestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const newBotMessage: Message = {
        id: userMsgId + 1, // distinct ID
        sender: 'bot',
        text: 'Hello from the bot 🤖',
        timestamp: botTimestamp,
      };

      setMessages((prev) => [...prev, newBotMessage]);
    }, 100); // quick reply delay
  };

  return (
    <div className="chat-root">
      <ChatHeader />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      <MessageInput input={input} setInput={setInput} onSend={handleSend} />
    </div>
  );
}

export default App;
