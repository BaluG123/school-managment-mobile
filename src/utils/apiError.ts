import { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error || typeof error !== 'object') return fallback;

  const err = error as FetchBaseQueryError;

  // Network failure — can't reach server
  if (err.status === 'FETCH_ERROR') {
    return 'Cannot connect to server. Make sure Django is running on port 8000 and API URL is correct in config.ts';
  }

  if (err.status === 'TIMEOUT_ERROR') {
    return 'Request timed out. Check your network connection.';
  }

  if (typeof err.status === 'number' && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;

    // Django REST field errors: { "username": ["msg"], "password_confirm": ["msg"] }
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value[0]) {
        return String(value[0]);
      }
      if (typeof value === 'string') {
        return value;
      }
    }

    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  if (typeof err.status === 'number') {
    return `Request failed (${err.status})`;
  }

  return fallback;
}
