import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { page_contents } from "../db/schema";
import { success, error } from "../utils/response";

const pagesRoutes = new Hono();

/**
 * GET /api/v1/admin/pages/:slug
 * Retourne la structure attendue par l'éditeur Frontend
 */
pagesRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const contents = await db
      .select()
      .from(page_contents)
      .where(eq(page_contents.page_slug, slug));

    // Transformer le tableau plat en structure { slug, sections: [...] }
    const sections = contents.map((row) => ({
      key: row.section_key,
      type: row.content_type || "text",
      value: row.content_value || "",
      image_url: row.content_type === "image" ? row.content_value : undefined,
    }));

    return success(c, {
      slug,
      sections,
    });
  } catch (err) {
    console.error(`Erreur chargement page ${slug}:`, err);
    return error(c, "Erreur lors de la récupération de la page", 500);
  }
});

/**
 * POST /api/v1/admin/pages/:slug
 * Supporte JSON et Form-Data (pour l'upload d'images)
 */
pagesRoutes.post("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const contentType = c.req.header("content-type") || "";

  try {
    let key = "";
    let value = "";
    let type = "text";

    // 1. Parsing selon le type de requête
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const body = await c.req.parseBody();
      key = body["key"] as string;
      value = body["value"] as string;

      // Traitement éventuel du fichier image
      const imageFile = body["image"];
      if (imageFile && imageFile instanceof File) {
        // TODO: Uploader le fichier sur Cloudflare R2 / S3
        // const uploadedUrl = await uploadToR2(imageFile);
        // value = uploadedUrl;
        type = "image";
      }
    } else {
      const body = await c.req.json();
      key = body.key || body.section_key;
      value = body.value || body.content_value || "";
      type = body.type || body.content_type || "text";
    }

    if (!key) {
      return error(c, "La clé de section (key) est requise", 400);
    }

    // 2. UPSERT en BDD
    await db
      .insert(page_contents)
      .values({
        page_slug: slug,
        section_key: key,
        content_value: value,
        content_type: type,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [page_contents.page_slug, page_contents.section_key],
        set: {
          content_value: value,
          content_type: type,
          updated_at: new Date(),
        },
      });

    return success(c, null, "Section mise à jour avec succès");
  } catch (err) {
    console.error(`Erreur mise à jour de la page ${slug}:`, err);
    return error(c, "Erreur lors de la sauvegarde du contenu", 500);
  }
});

export default pagesRoutes;