import { Hono } from "hono";
import { inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { success, error } from "../utils/response";

const settingsRoutes = new Hono();

export const PUBLIC_KEYS = [
  "contact_email",
  "contact_phone",
  "contact_address",
  "social_facebook",
  "social_linkedin",
  "social_instagram",
  "social_twitter",
  "whatsapp_number",
] as const;

type PublicKey = (typeof PUBLIC_KEYS)[number];

// Helper de lecture sécurisée du body
async function parseBody(c: any): Promise<Record<string, any> | null> {
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
  try {
    // 1. Récupération des données existantes en BDD
    const publicSettings = await db
      .select()
      .from(settings)
      .where(inArray(settings.key, [...PUBLIC_KEYS]));

    // 2. Initialisation du dictionnaire avec des valeurs par défaut vides pour TOUTES les clés
    const map: Record<PublicKey, string> = PUBLIC_KEYS.reduce(
      (acc, key) => {
        acc[key] = "";
        return acc;
      },
      {} as Record<PublicKey, string>,
    );

    // 3. Injection des valeurs trouvées en BDD
    for (const item of publicSettings) {
      if (item.key in map) {
        map[item.key as PublicKey] = item.value || "";
      }
    }

    return success(c, { map });
  } catch (err) {
    console.error("Erreur GET settings:", err);
    return error(c, "Impossible de récupérer les paramètres", 500);
  }
});

// PUT /api/v1/settings
settingsRoutes.put("/", async (c) => {
  try {
    const body = await parseBody(c);

    if (!body || typeof body !== "object") {
      return error(c, "Corps de requête invalide", 400);
    }

    // Filtrer pour ne garder que les clés autorisées
    const keysToUpdate = Object.keys(body).filter((k) =>
      (PUBLIC_KEYS as readonly string[]).includes(k),
    );

    if (keysToUpdate.length === 0) {
      return error(c, "Aucune clé valide à mettre à jour", 400);
    }

    // Préparation des objets d'insertion/upsert
    const valuesToInsert = keysToUpdate.map((key) => ({
      key,
      value: String(body[key] ?? ""),
      updated_at: new Date(),
    }));

    // Upsert atomique (en 1 seule requête SQL)
    await db
      .insert(settings)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: sql`EXCLUDED.value`,
          updated_at: sql`CURRENT_TIMESTAMP`,
        },
      });

    return success(c, { message: "Settings mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur PUT settings:", err);
    return error(c, "Erreur lors de la mise à jour des paramètres", 500);
  }
});

export default settingsRoutes;
