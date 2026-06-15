// Central API configuration.
// In development, VITE_API_URL can be set in the root .env file.
// Falls back to http://localhost:3001 for zero-config local development.
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';
