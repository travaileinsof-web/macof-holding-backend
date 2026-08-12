import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';
import filialesRoutes from './routes/filiales.routes';
import galerieRoutes from './routes/galerie.routes';
import cataloguesRoutes from './routes/catalogues.routes';
import pagesRoutes from './routes/pages.routes';
import settingsRoutes from './routes/settings.routes';
import { eventsRoutes } from './routes/events.routes';
import adminRoutes from './routes/admin/auth.routes';

const app = new Hono();

app.use('*', async (c, next) => {
  console.log(`[REQ] ${c.req.method} ${c.req.url}`);
  await next();
});
app.use('*', corsMiddleware());
app.onError(errorHandler);

// Serve locally uploaded files (dev fallback when Vercel Blob is not configured)
app.use('/uploads/*', serveStatic({ root: './storage/' }));

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'MACOF Holding API - Serveur operationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── Public Routes (v1) ────────────────────────────────────────────────────────

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/demandes', contactRoutes);
app.route('/api/v1/filiales', filialesRoutes);
app.route('/api/v1/galerie', galerieRoutes);
app.route('/api/v1/catalogues', cataloguesRoutes);
app.route('/api/v1/pages', pagesRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/events', eventsRoutes);

// ─── Admin Routes (v1) ──────────────────────────────────────────────────────

app.route('/api/v1/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: `Route non trouvee: ${c.req.method} ${c.req.url}`,
    },
    404,
  );
});

// ─── Export for Vercel ─────────────────────────────────────────────────────

export default app;

// ─── Local Dev Server ──────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3001;
console.log(`\n🚀 MACOF API Server → http://localhost:${port}\n`);

serve({ fetch: app.fetch, port });
