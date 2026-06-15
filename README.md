# Sandbox Chat Platform

A lightweight local chat sandbox designed to simulate a client talking to a future Telegram chatbot. This allows developers to iterate on bot response logic and conversation flows locally without setting up real Telegram API integrations, webhooks, or databases.

---

## Architecture Overview

```text
+-----------------------+
|      Browser UI       |
| (React + Vite Client) |
+-----------------------+
            |
            | POST /message (JSON payload)
            v
+-----------------------+
|  POST /message Route  |
+-----------------------+
            |
            | maps payload to ChatMessage type
            v
+-----------------------+
|      Bot Engine       | (Decoupled, pure, testable service)
+-----------------------+
            |
            | returns BotReply & stores turn history in ConversationStore
            v
+-----------------------+
|     JSON Response     |
+-----------------------+
            |
            v
+-----------------------+
|      Browser UI       | (Updates chat history and logs panel)
+-----------------------+
```

---

## Technology Stack

- **Frontend:** React, Vite, TypeScript, Vanilla CSS
- **Backend:** Node.js, Express, TypeScript, ts-node-dev (for hot reload)
- **State Management:** In-memory store (volatile, resets when backend restarts)

---

## Directory Structure

```text
/
├── frontend/             # React Client
│   ├── src/
│   │   ├── config/       # API configuration
│   │   ├── App.tsx       # Main UI structure and state
│   │   ├── chat.css      # Custom styling
│   │   └── main.tsx
│   └── package.json
│
├── backend/              # Express API Server
│   ├── src/
│   │   ├── services/     # Bot logic & memory stores
│   │   ├── types/        # Message contract definitions
│   │   └── index.ts      # Server configuration and routes
│   └── package.json
│
├── docs/                 # Documentation (e.g. Telegram compatibility mapping)
├── implementation_plans/ # Archived implementation specifications
├── KICKSTART.md          # Step-by-step checklist of requirements
└── package.json          # Root workspace configuration
```

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

---

## Getting Started

### 1. Installation

Install dependencies for the root, frontend, and backend packages:

```bash
# Install root dependencies (concurrently)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file at the project root (using the template provided in `.env.example`):

```bash
cp .env.example .env
```

The default configuration is:
```dotenv
PORT=3001
VITE_API_URL=http://localhost:3001
```

### 3. Running the Sandbox

To spin up both the frontend and backend servers concurrently with a single command:

```bash
npm run dev
```

- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## Developer Operations & API

### API Endpoints

- **`POST /message`**: Submits a message to the bot.
  - **Request Body:**
    ```json
    {
      "userId": "sandbox-user",
      "message": "Hello"
    }
    ```
  - **Response Body:**
    ```json
    {
      "message": "Hello from the bot"
    }
    ```
- **`GET /logs`**: Retrieves the history of INCOMING and OUTGOING message packets stored in the backend memory.
- **`GET /health`**: Health status check.

### Code Quality (Linting)

To run the linter across both frontend and backend directories:

```bash
npm run lint
```
