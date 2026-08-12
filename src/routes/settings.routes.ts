import { Hono } from "hono";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { success, error } from "../utils/response";

const settingsRoutes = new Hono();

const PUBLIC_KEYS = [
  "contact_email",
  "contact_phone",
  "contact_address",
  "social_facebook",
  "social_linkedin",
  "social_instagram",
  "social_twitter",
  "whatsapp_number",
] as const;

// Helper de lecture sécurisée du body
async function parseBody(c: any) {
  const contentType = c.req.header("content-type") || "";
  try {
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      return await c.req.parseBody();
    }
    return await c.req.json();
  } catch {
    return null;
  }
}

// GET /api/v1/settings
settingsRoutes.get("/", async (c) => {
  // 1. Filtrage directement au niveau SQL
  const publicSettings = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...PUBLIC_KEYS]));

  const map = publicSettings.reduce(
    (acc, curr) => {
      acc[curr.key] = curr.value || "";
      return acc;
    },
    {} as Record<string, string>,
  );

  return success(c, { map });
});

// PUT /api/v1/settings
settingsRoutes.put("/", async (c) => {
  const body = await parseBody(c);

  if (!body || typeof body !== "object") {
    return error(c, "Corps de requête invalide", 400);
  }

  const keysToUpdate = Object.keys(body).filter((k) =>
    PUBLIC_KEYS.includes(k as any),
  );

  if (keysToUpdate.length === 0) {
    return error(c, "Aucune clé valide à mettre à jour", 400);
  }

  // 2. Préparation du tableau d'upsert
  const valuesToInsert = keysToUpdate.map((key) => ({
    key,
    value: String(body[key] ?? ""),
    updated_at: new Date(),
  }));

  // 3. Upsert en 1 seule requête SQL (suppose que 'key' a une contrainte UNIQUE ou est clé primaire)
  await db
    .insert(settings)
    .values(valuesToInsert)
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: sql`EXCLUDED.value`,
        updated_at: new Date(),
      },
    });

  return success(c, { message: "Settings updated successfully" });
});

export default settingsRoutes;
