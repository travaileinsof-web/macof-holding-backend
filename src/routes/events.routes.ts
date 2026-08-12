import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eventEmitter } from "../services/events";

export const eventsRoutes = new Hono();

eventsRoutes.get("/", (c) => {
  // Headers pour éviter la mise en cache et le buffering proxy (Nginx, Cloudflare)
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    // 1. Définir le délai de reconnexion auto pour le navigateur (ex: 5 secondes)
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ status: "ok" }),
      retry: 5000,
    });

    // 2. Ping périodique pour maintenir la connexion active (keep-alive)
    const interval = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "ping" }).catch(() => {
        // Ignorer l'erreur si le flux s'est fermé avant la purge de l'intervalle
      });
    }, 15000);

    // 3. Listener d'invalidation
    const onInvalidate = async (data: { entity: string }) => {
      try {
        await stream.writeSSE({
          event: "invalidate",
          data: JSON.stringify(data),
        });
      } catch (err) {
        console.error("Erreur écriture SSE:", err);
      }
    };

    eventEmitter.on("invalidate", onInvalidate);

    // 4. Promesse nettoyée proprement lors de la déconnexion
    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        clearInterval(interval);
        eventEmitter.off("invalidate", onInvalidate);
        resolve(); // Résout la promesse et libère la ressource
      });
    });
  });
});
