import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client";
import { filiales } from "../db/schema";
import { success, error } from "../utils/response";
import { deleteFile, uploadFile } from "../services/upload";

const filialesRoutes = new Hono();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload d'image via Vercel Blob (ou fallback local)
 */
async function uploadImageIfPresent(
  image: unknown,
  existingUrl: string | null,
): Promise<{ url: string | null; err?: string }> {
  // Pas de fichier fourni ou déjà une URL sous forme de string -> conserve la valeur
  if (!image || typeof image === "string") {
    return { url: typeof image === "string" ? image : existingUrl };
  }

  // body.image est un objet File (issu de c.req.parseBody())
  const file = image as File;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      url: existingUrl,
      err: "Type de fichier non autorisé (jpeg, png, webp, gif uniquement).",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { url: existingUrl, err: "Image trop volumineuse (5 Mo max)." };
  }

  try {
    const publicUrl = await uploadFile(file, "filiales");
    return { url: publicUrl };
  } catch (err) {
    console.error("Erreur lors de l'upload vers Vercel Blob :", err);
    return { url: existingUrl, err: "Échec du téléversement de l'image." };
  }
}

/**
 * Suppression de l'image via Vercel Blob (ou stockage local)
 */
async function deleteImageFromStorage(imageUrl: string | null) {
  if (!imageUrl) return;

  try {
    await deleteFile(imageUrl);
  } catch (err) {
    console.error("Erreur suppression image storage :", err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseRequestBody(c: any) {
  const contentType = c.req.header("content-type") || "";
  try {
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      return await c.req.parseBody();
    }
    return await c.req.json();
  } catch (err) {
    return null;
  }
}

function parseDetailsJson(detailsStr?: any) {
  if (!detailsStr || typeof detailsStr !== "string") return null;
  const items = detailsStr
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return items.length > 0 ? { items } : null;
}

// ─── GET / - Lister les filiales (Admin) ────────────────────────────────────
filialesRoutes.get("/", async (c) => {
  const results = await db
    .select()
    .from(filiales)
    .where(eq(filiales.archived, false))
    .orderBy(asc(filiales.nom));

  return success(c, results);
});

// ─── GET /public - Filiales actives uniquement (Site vitrine) ───────────────
filialesRoutes.get("/public", async (c) => {
  const results = await db
    .select()
    .from(filiales)
    .where(and(eq(filiales.archived, false), eq(filiales.statut, "actif")))
    .orderBy(asc(filiales.nom));

  return success(c, results);
});

// ─── GET /:slug ───────────────────────────────────────────────────────────────
filialesRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const [filiale] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.slug, slug))
    .limit(1);

  if (!filiale) return error(c, "Filiale non trouvée", 404);
  return success(c, filiale);
});

// ─── GET /id/:id ─────────────────────────────────────────────────────────────
filialesRoutes.get("/id/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return error(c, "ID invalide", 400);

  const [filiale] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!filiale) return error(c, "Filiale non trouvée", 404);
  return success(c, filiale);
});

// ─── POST / - Créer une nouvelle filiale ─────────────────────────────────────
filialesRoutes.post("/", async (c) => {
  const body = await parseRequestBody(c);
  if (!body || !body.nom) {
    return error(c, "Le nom de la filiale est obligatoire", 400);
  }

  const { url: imageUrl, err: imageErr } = await uploadImageIfPresent(
    body.image,
    null,
  );
  if (imageErr) return error(c, imageErr, 400);

  const detailsJson = parseDetailsJson(body.details);

  const insertData = {
    nom: String(body.nom),
    slug: String(body.slug || ""),
    secteur: String(body.secteur || ""),
    description: String(body.description || ""),
    details_json: detailsJson,
    email: String(body.email || ""),
    telephone: String(body.telephone || ""),
    adresse: String(body.adresse || ""),
    site_web: String(body.site_web || ""),
    statut: (String(body.statut || "actif") as "actif" | "inactif"),
    image_url: imageUrl || "",
    created_at: new Date(),
    updated_at: new Date(),
  } as any;

  const [created] = await db
    .insert(filiales)
    .values(insertData)
    .returning();

  return success(c, created, "Filiale créée", 201);
});

// ─── Handler réutilisable pour la mise à jour (PUT) ──────────────────────────
const updateFilialeHandler = async (c: any) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return error(c, "ID invalide", 400);

  const body = await parseRequestBody(c);
  if (!body) return error(c, "Données envoyées invalides ou inexistantes", 400);

  const [existing] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!existing) return error(c, "Filiale non trouvée", 404);

  const detailsJson =
    body.details !== undefined
      ? parseDetailsJson(body.details)
      : existing.details_json;

  const { url: imageUrl, err: imageErr } = await uploadImageIfPresent(
    body.image,
    existing.image_url,
  );
  if (imageErr) return error(c, imageErr, 400);

  // Si une nouvelle image a été uploadée avec succès, on supprime l'ancienne
  if (
    body.image &&
    typeof body.image !== "string" &&
    existing.image_url &&
    imageUrl !== existing.image_url
  ) {
    await deleteImageFromStorage(existing.image_url);
  }

  const statutValue = body.statut !== undefined ? (String(body.statut) as "actif" | "inactif") : existing.statut;

  await db
    .update(filiales)
    .set({
      nom: body.nom !== undefined ? String(body.nom) : existing.nom,
      slug: body.slug !== undefined ? String(body.slug) : existing.slug,
      secteur:
        body.secteur !== undefined ? String(body.secteur) : existing.secteur,
      description:
        body.description !== undefined
          ? String(body.description)
          : existing.description,
      details_json: detailsJson,
      email: body.email !== undefined ? String(body.email) : existing.email,
      telephone:
        body.telephone !== undefined
          ? String(body.telephone)
          : existing.telephone,
      adresse:
        body.adresse !== undefined ? String(body.adresse) : existing.adresse,
      site_web:
        body.site_web !== undefined ? String(body.site_web) : existing.site_web,
      statut: statutValue,
      image_url: imageUrl ?? existing.image_url,
      updated_at: new Date(),
    })
    .where(eq(filiales.id, id));

  return success(c, { message: "Filiale mise à jour avec succès" });
};

// ─── PUT /id/:id & /:id ──────────────────────────────────────────────────────
filialesRoutes.put("/id/:id", updateFilialeHandler);
filialesRoutes.put("/:id", updateFilialeHandler);

// ─── DELETE /:id (Archivage soft delete) ─────────────────────────────────────
filialesRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return error(c, "ID invalide", 400);

  const [existing] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!existing) return error(c, "Filiale non trouvée", 404);

  await db
    .update(filiales)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(filiales.id, id));

  return success(c, { message: "Filiale archivée avec succès" });
});

export default filialesRoutes;
