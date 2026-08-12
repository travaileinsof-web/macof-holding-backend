import type { Context } from 'hono';

interface SuccessResponse {
  success: true;
  data: unknown;
  message?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
}

export function success(
  c: Context,
  data: unknown,
  message?: string,
  status: number = 200,
) {
  const body: SuccessResponse = { success: true, data };
  if (message) {
    body.message = message;
  }
  return c.json(body, status as any);
}

export function error(
  c: Context,
  message: string,
  status: number = 400,
) {
  const body: ErrorResponse = { success: false, message };
  return c.json(body, status as 400);
}
