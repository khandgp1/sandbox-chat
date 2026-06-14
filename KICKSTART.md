# KICKSTART.md

## Project: Sandbox Chat Platform

### Objective

Build a lightweight local chat sandbox that simulates a client talking to a future Telegram chatbot.

The sandbox should allow a developer to:

1. Open a web page.
2. Type messages as if they are a client.
3. Send messages to a local backend.
4. Receive responses from a placeholder bot engine.
5. View incoming and outgoing messages.
6. Iterate on backend logic without requiring Telegram.

This project is intentionally minimal. Do not implement Telegram integration, authentication, databases, user management, AI integrations, or production infrastructure.

---

# Technical Stack

## Frontend

* React
* Vite
* TypeScript

## Backend

* Node.js
* Express
* TypeScript

## State

* In-memory only
* No database

---

# Architecture

```text
Browser UI
    |
    v
POST /message
    |
    v
Bot Engine
    |
    v
JSON Response
    |
    v
Browser UI
```

Future architecture:

```text
Telegram
    |
    v
Webhook
    |
    v
Bot Engine
    |
    v
Telegram Response
```

The sandbox UI should act as a fake Telegram client.

---

# Project Structure

```text
/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── src/
│   └── package.json
│
└── KICKSTART.md
```

---

# Phase 1: Project Setup

## Goal

Create runnable frontend and backend applications.

### Tasks

* [x] Create frontend project using React + Vite + TypeScript
* [x] Create backend project using Express + TypeScript
* [x] Configure development scripts
* [x] Configure local ports
* [x] Verify frontend starts
* [x] Verify backend starts

### Success Criteria

* Frontend available in browser
* Backend available locally
* No runtime errors

---

# Phase 2: Backend Message API

## Goal

Create a simple message endpoint.

### Endpoint

```http
POST /message
```

### Request

```json
{
  "userId": "sandbox-user",
  "message": "Hello"
}
```

### Response

```json
{
  "message": "Hello from the bot"
}
```

### Tasks

* [ ] Create POST /message endpoint
* [ ] Validate request payload
* [ ] Return placeholder response
* [ ] Add basic error handling
* [ ] Add request logging

### Success Criteria

Sending a request returns a valid bot response.

---

# Phase 3: Chat UI

## Goal

Create a simple single-user chat interface.

### Required Components

#### Chat Window

Displays conversation history.

#### Message Input

Allows user to type.

#### Send Button

Submits message.

### Tasks

* [ ] Create chat layout
* [ ] Create message list component
* [ ] Create input component
* [ ] Create send button
* [ ] Display user messages
* [ ] Display bot responses
* [ ] Auto-scroll to latest message

### Success Criteria

User can send messages and see responses.

---

# Phase 4: Frontend ↔ Backend Integration

## Goal

Connect the chat UI to the backend API.

### Flow

```text
User Message
    |
    v
POST /message
    |
    v
Backend
    |
    v
Response
    |
    v
Chat Window
```

### Tasks

* [ ] Connect UI to API
* [ ] Send user message
* [ ] Receive backend response
* [ ] Display response in chat
* [ ] Handle loading state
* [ ] Handle network errors

### Success Criteria

Conversation works end-to-end.

---

# Phase 5: Message Logging Panel

## Goal

Provide visibility into message flow.

### Layout

```text
--------------------------------
Chat Window
--------------------------------

--------------------------------
Message Logs
--------------------------------

INCOMING:
Hello

OUTGOING:
Hi there
```

### Tasks

* [ ] Create log panel
* [ ] Log incoming messages
* [ ] Log outgoing messages
* [ ] Show timestamps
* [ ] Keep logs in memory

### Success Criteria

Developer can inspect message flow.

---

# Phase 6: Bot Engine Extraction

## Goal

Separate chat logic from API routes.

### Structure

```text
backend/
├── routes/
├── services/
│   └── botEngine.ts
```

### Tasks

* [ ] Create botEngine service
* [ ] Move response generation into service
* [ ] Keep API route thin
* [ ] Add unit-testable interface

### Example

```typescript
generateReply(message: string): string
```

### Success Criteria

API routes only orchestrate requests.

---

# Phase 7: Conversation Memory (In-Memory)

## Goal

Allow multi-message conversations.

### Example

```text
User: Hi
Bot: Hello

User: My name is John
Bot: Nice to meet you John
```

### Tasks

* [ ] Add in-memory conversation store
* [ ] Track message history
* [ ] Pass history to bot engine
* [ ] Support single sandbox user

### Success Criteria

Conversation context is retained while app is running.

---

# Phase 8: Telegram Compatibility Layer

## Goal

Prepare for future Telegram integration.

### Message Contract

Define internal message model.

```typescript
type ChatMessage = {
  userId: string;
  text: string;
  timestamp: string;
};
```

### Tasks

* [ ] Create shared message model
* [ ] Standardize request structure
* [ ] Standardize response structure
* [ ] Document future Telegram mapping

### Success Criteria

Sandbox and future Telegram integration can use the same bot engine.

---

# Phase 9: Developer Experience

## Goal

Improve usability during development.

### Tasks

* [ ] Add README
* [ ] Add environment variables
* [ ] Add API configuration file
* [ ] Add linting
* [ ] Add formatting
* [ ] Add startup instructions

### Success Criteria

New developer can run project in minutes.

---

# Out of Scope

Do NOT implement:

* Telegram integration
* Authentication
* User accounts
* Databases
* AI providers
* OpenAI integration
* Vector databases
* File uploads
* Voice messages
* Images
* Multiple users
* Production deployment
* Analytics
* WebSockets

Keep the project intentionally simple.

---

# Definition of Done

The project is complete when:

* [ ] Frontend runs locally
* [ ] Backend runs locally
* [ ] User can type messages
* [ ] Messages are sent to backend
* [ ] Backend returns responses
* [ ] Responses appear in chat
* [ ] Incoming messages are logged
* [ ] Outgoing messages are logged
* [ ] Bot logic is isolated in a bot engine module
* [ ] No Telegram dependency exists
* [ ] Entire application runs locally with a single command sequence

```
```
