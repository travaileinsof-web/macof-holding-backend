import type { Context } from 'hono';
import type { ZodError } from 'zod';
import { error } from '../utils/response';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`, err.stack);

  // Handle Zod validation errors
  if (isZodError(err)) {
    const firstIssue = err.issues?.[0];
    const message = firstIssue?.message || 'Donnees invalides';
    return error(c, message, 422);
  }

  // Handle custom app errors with status
  const appError = err as AppError;
  if (appError.status) {
    return error(c, appError.message, appError.status);
  }

  // Handle JSON parse errors
  if (err.message.includes('JSON') || err.message.includes('json')) {
    return error(c, 'Donnees JSON invalides', 400);
  }

  // Default internal server error
  if (process.env.NODE_ENV === 'production') {
    return error(c, 'Une erreur interne est survenue', 500);
  }

  return error(c, `Erreur interne: ${err.message}`, 500);
}

function isZodError(err: Error): err is ZodError {
  return 'issues' in err && Array.isArray((err as ZodError).issues);
}
