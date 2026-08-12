import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { page_contents } from "../db/schema";
import { success, error } from "../utils/response";

const pagesRoutes = new Hono();

/**
 * GET /api/v1/pages/:slug
 * Récupère tout le contenu d'une page sous forme d'objet plat { key: value }.
 * Renvoie un objet vide `{}` (HTTP 200) si la page n'a pas encore de contenu en BDD,
 * ce qui permet au Frontend d'utiliser ses données par défaut (FALLBACK).
 */
pagesRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const contents = await db
      .select()
      .from(page_contents)
      .where(eq(page_contents.page_slug, slug));

    // Construction d'une map clé/valeur : { hero_title: "...", phone: "..." }
    const flat: Record<string, string> = {};
    for (const row of contents) {
      flat[row.section_key] = row.content_value || "";
    }

    return success(c, flat);
  } catch (err) {
    console.error(`Erreur chargement page ${slug}:`, err);
    return error(c, "Erreur lors de la récupération de la page", 500);
  }
});

/**
 * GET /api/v1/pages/:slug/:section
 * Récupère une section spécifique d'une page.
 */
pagesRoutes.get("/:slug/:section", async (c) => {
  const slug = c.req.param("slug");
  const section = c.req.param("section");

  try {
    const [content] = await db
      .select()
      .from(page_contents)
      .where(
        and(
          eq(page_contents.page_slug, slug),
          eq(page_contents.section_key, section),
        ),
      )
      .limit(1);

    if (!content) {
      return error(c, "Section non trouvée", 404);
    }

    return success(c, {
      page_slug: slug,
      section_key: content.section_key,
      content_value: content.content_value,
      content_type: content.content_type,
      updated_at: content.updated_at,
    });
  } catch (err) {
    console.error(
      `Erreur chargement section ${section} de la page ${slug}:`,
      err,
    );
    return error(c, "Erreur serveur", 500);
  }
});

/**
 * POST /api/v1/pages/:slug
 * Sauvegarde/Met à jour (UPSERT) les sections d'une page.
 * Accepte soit un dictionnaire global { key: "value", key2: "value2" },
 * soit un objet unique { section_key: "...", content_value: "...", content_type?: "..." }.
 */
pagesRoutes.post("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();

  try {
    const entriesToUpsert: Array<{
      page_slug: string;
      section_key: string;
      content_value: string;
      content_type?: string;
      updated_at: Date;
    }> = [];

    // Cas 1 : Format objet clé/valeur { "title": "...", "subtitle": "..." }
    if (typeof body === "object" && body !== null && !("section_key" in body)) {
      for (const [key, val] of Object.entries(body)) {
        entriesToUpsert.push({
          page_slug: slug,
          section_key: key,
          content_value: typeof val === "string" ? val : JSON.stringify(val),
          updated_at: new Date(),
        });
      }
    }
    // Cas 2 : Format unitaire { section_key: "title", content_value: "..." }
    else if (body.section_key) {
      entriesToUpsert.push({
        page_slug: slug,
        section_key: body.section_key,
        content_value: body.content_value || "",
        content_type: body.content_type || "text",
        updated_at: new Date(),
      });
    } else {
      return error(c, "Format de données invalide", 400);
    }

    if (entriesToUpsert.length === 0) {
      return error(c, "Aucune donnée à enregistrer", 400);
    }

    // Exécution de l'UPSERT avec Drizzle ORM (Insert or Update on conflict)
    for (const item of entriesToUpsert) {
      await db
        .insert(page_contents)
        .values(item)
        .onConflictDoUpdate({
          target: [page_contents.page_slug, page_contents.section_key],
          set: {
            content_value: item.content_value,
            content_type: item.content_type || page_contents.content_type,
            updated_at: new Date(),
          },
        });
    }

    return success(c, null, "Contenu de la page mis à jour avec succès");
  } catch (err) {
    console.error(`Erreur mise à jour de la page ${slug}:`, err);
    return error(c, "Erreur lors de la sauvegarde du contenu", 500);
  }
});

export default pagesRoutes;
