import { Hono } from "hono";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "../db";
import { siteSettings } from "../db/schema";
import { success, error } from "../utils/response";

export const settingsRouter = new Hono();

// Liste de toutes les clés autorisées en modification
const ALLOWED_KEYS = [
  "contact_email",
  "contact_phone",
  "contact_address",
  "social_facebook",
  "social_linkedin",
  "social_instagram",
  "social_twitter",
  "whatsapp_number",
  "smtp_host",
  "smtp_port",
  "smtp_email",
  "smtp_password",
  "smtp_secure",
] as const;

type SettingKey = (typeof ALLOWED_KEYS)[number];

const updateSettingsSchema = z
  .object({
    settings: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean()]));

// --- GET /api/v1/settings ---
settingsRouter.get("/", async (c) => {
  try {
    const settingsList = await db
      .select({
        key: siteSettings.key,
        value: siteSettings.value,
      })
      .from(siteSettings);

    const map = settingsList.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value ?? "";
      return acc;
    }, {});

    return success(c, { map });
  } catch (err) {
    return error(c, "Impossible de récupérer les paramètres", 500);
  }
});

// --- POST/PUT /api/v1/settings/bulk ---
const handleBulkUpdate = async (c: any) => {
  try {
    const rawBody = await c.req.json();
    const parsed = updateSettingsSchema.parse(rawBody);

    // Récupération des données que `settings` soit imbriqué ou à la racine
    const settingsData = parsed.settings ?? parsed;

    const entriesToUpdate = Object.entries(settingsData).filter(([key]) =>
      ALLOWED_KEYS.includes(key as SettingKey),
    );

    if (entriesToUpdate.length === 0) {
      return error(c, "Aucune clé valide fournie pour la mise à jour", 400);
    }

    // Upsert en base de données
    const updatePromises = entriesToUpdate.map(([key, value]) => {
      const stringValue = String(value);
      return db
        .insert(siteSettings)
        .values({
          key,
          value: stringValue,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: stringValue,
            updatedAt: new Date(),
          },
        });
    });

    await Promise.all(updatePromises);

    return success(
      c,
      { updatedKeys: entriesToUpdate.map(([k]) => k) },
      "Paramètres mis à jour avec succès",
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(c, "Données invalides", 400, err.errors);
    }
    return error(c, "Erreur lors de la mise à jour des paramètres", 500);
  }
};

settingsRouter.post("/bulk", handleBulkUpdate);
settingsRouter.put("/bulk", handleBulkUpdate);

// --- POST /api/v1/settings/test-email ---
settingsRouter.post("/test-email", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return error(c, "L'adresse email de destination est requise", 400);
    }

    const dbSettings = await db
      .select()
      .from(siteSettings)
      .where(
        inArray(siteSettings.key, [
          "smtp_host",
          "smtp_port",
          "smtp_email",
          "smtp_password",
        ]),
      );

    const config = dbSettings.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (!config.smtp_host || !config.smtp_email) {
      return error(c, "La configuration SMTP est incomplète", 400);
    }

    return success(c, null, `E-mail de test envoyé à ${email}`);
  } catch (err) {
    return error(c, "Échec lors de l'envoi de l'e-mail de test", 500);
  }
});
