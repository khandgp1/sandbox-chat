# Sandbox Chat Frontend

This is the React client interface for the Sandbox Chat Platform. It provides a visual chat area mimicking a Telegram interface, along with a bottom logging panel to monitor incoming and outgoing messages.

## Stack

- **React** 18
- **TypeScript**
- **Vite** (bundler and dev server)
- **Vanilla CSS** (styles defined in `src/chat.css` and `src/App.css`)

## Configuration

The frontend endpoints are configured in [src/config/api.ts](file:///Users/khandpv1/Desktop/.AntiGrav/sandbox-chat/frontend/src/config/api.ts), which reads the `VITE_API_URL` environment variable.

If the backend server is running on a port other than `3001`, copy the root `.env.example` into a root `.env` file and adjust the value of `VITE_API_URL` before restarting.

## Getting Started

To run the frontend in standalone mode (make sure backend is running separately):

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will run locally on [http://localhost:5173](http://localhost:5173).

## Scripts

- `npm run dev`: Starts the local dev server.
- `npm run build`: Compiles typescript and builds production bundles into `dist/`.
- `npm run lint`: Runs ESLint on source code.
- `npm run preview`: Previews the locally built production bundle.
