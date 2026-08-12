import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';

const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://macof-holding.com',
  'https://www.macof-holding.com',
];

export const corsMiddleware = () => {
  return cors({
    origin: (origin: string | undefined, c: Context) => {
      if (!origin) return '*';

      if (process.env.NODE_ENV === 'development') {
        return origin;
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        return origin;
      }

      return ALLOWED_ORIGINS[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
    credentials: true,
  });
};
