import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { page_contents } from "../db/schema";
import { success, error } from "../utils/response";
import { uploadFile } from "../services/upload";

const pagesRoutes = new Hono();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

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
 * Supporte JSON et Form-Data (avec upload d'images via Vercel Blob / Local)
 */
pagesRoutes.post("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const contentType = c.req.header("content-type") || "";

  try {
    let key = "";
    let value = "";
    let type: string | undefined = undefined;

    // 1. Parsing du body selon le Content-Type
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const body = await c.req.parseBody();
      key = body["key"] as string;
      value = (body["value"] as string) || "";

      // Récupération de l'image si elle est présente sous forme de fichier
      const imageFile = body["image"];
      if (imageFile && imageFile instanceof File && imageFile.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
          return error(
            c,
            "Type d'image non autorisé (jpeg, png, webp, gif uniquement)",
            400,
          );
        }

        if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
          return error(c, "Image trop volumineuse (5 Mo max)", 400);
        }

        // Upload vers Vercel Blob (ou fallback local)
        const uploadedUrl = await uploadFile(imageFile, "pages");
        value = uploadedUrl;
        type = "image";
      }
    } else {
      const body = await c.req.json();
      key = body.key || body.section_key;
      value = body.value || body.content_value || "";
      type = body.type || body.content_type;
    }

    if (!key) {
      return error(c, "La clé de section (key) est requise", 400);
    }

    // 2. Vérification de la section existante pour conserver son type si non spécifié
    const [existing] = await db
      .select()
      .from(page_contents)
      .where(
        and(
          eq(page_contents.page_slug, slug),
          eq(page_contents.section_key, key),
        ),
      )
      .limit(1);

    const finalType = type || existing?.content_type || "text";

    // 3. Upsert en base de données
    await db
      .insert(page_contents)
      .values({
        page_slug: slug,
        section_key: key,
        content_value: value,
        content_type: finalType,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [page_contents.page_slug, page_contents.section_key],
        set: {
          content_value: value,
          content_type: finalType,
          updated_at: new Date(),
        },
      });

    return success(
      c,
      {
        key,
        type: finalType,
        value,
        image_url: finalType === "image" ? value : undefined,
      },
      "Section mise à jour avec succès",
    );
  } catch (err) {
    console.error(`Erreur mise à jour de la page ${slug}:`, err);
    return error(c, "Erreur lors de la sauvegarde du contenu", 500);
  }
});

export default pagesRoutes;