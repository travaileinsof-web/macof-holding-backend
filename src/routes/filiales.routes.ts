import { Hono } from "hono";
import { eq, and, asc } from "drizzle-orm";
import { db } from "../db/client";
import { filiales } from "../db/schema";
import { success, error } from "../utils/response";

const filialesRoutes = new Hono();

// Helper pour parser proprement le corps de la requête (JSON ou FormData)
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

// GET /api/filiales - List all active filiales (public)
filialesRoutes.get("/", async (c) => {
  const results = await db
    .select()
    .from(filiales)
    .where(and(eq(filiales.archived, false), eq(filiales.statut, "actif")))
    .orderBy(asc(filiales.nom));

  return success(c, results);
});

// GET /api/filiales/id/:id - Get single filiale by ID (supporté)
filialesRoutes.get("/id/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return error(c, "ID invalide", 400);

  const [filiale] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!filiale) {
    return error(c, "Filiale non trouvée", 404);
  }

  return success(c, filiale);
});

// GET /api/filiales/:slug - Get single filiale by slug (public)
filialesRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const [filiale] = await db
    .select()
    .from(filiales)
    .where(and(eq(filiales.slug, slug), eq(filiales.archived, false)))
    .limit(1);

  if (!filiale) {
    return error(c, "Filiale non trouvée", 404);
  }

  return success(c, filiale);
});

// Handler réutilisable pour la mise à jour
const updateFilialeHandler = async (c: any) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return error(c, "ID invalide", 400);
  }

  const body = await parseRequestBody(c);
  if (!body) {
    return error(c, "Données envoyées invalides ou inexistantes", 400);
  }

  const { telephone, email, adresse, site_web, description } = body;

  const [existing] = await db
    .select()
    .from(filiales)
    .where(eq(filiales.id, id))
    .limit(1);

  if (!existing) {
    return error(c, "Filiale non trouvée", 404);
  }

  await db
    .update(filiales)
    .set({
      telephone:
        telephone !== undefined ? String(telephone) : existing.telephone,
      email: email !== undefined ? String(email) : existing.email,
      adresse: adresse !== undefined ? String(adresse) : existing.adresse,
      site_web: site_web !== undefined ? String(site_web) : existing.site_web,
      description:
        description !== undefined ? String(description) : existing.description,
      updated_at: new Date(),
    })
    .where(eq(filiales.id, id));

  return success(c, { message: "Filiale mise à jour avec succès" });
};

// PUT /api/filiales/id/:id
filialesRoutes.put("/id/:id", updateFilialeHandler);

// PUT /api/filiales/:id (pour matcher /admin/filiales/6)
filialesRoutes.put("/:id", updateFilialeHandler);

export default filialesRoutes;
