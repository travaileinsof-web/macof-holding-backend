import { Hono } from "hono";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { db } from "../db/client";
import { catalogues, filiales } from "../db/schema";
import { success, error } from "../utils/response";

const cataloguesRoutes = new Hono();

// Helper pour résoudre une filiale (par ID, Slug ou Nom)
async function resolveFilialeId(value: string): Promise<number | null> {
  const isNumeric = /^\d+$/.test(value);
  if (isNumeric) return parseInt(value, 10);

  const [row] = await db
    .select({ id: filiales.id })
    .from(filiales)
    .where(or(eq(filiales.slug, value), eq(filiales.nom, value)))
    .limit(1);

  return row?.id ?? null;
}

// GET /api/v1/catalogues - List catalogues (public)
cataloguesRoutes.get("/", async (c) => {
  const filialeFilter = c.req.query("filiale");
  const typeFilter = c.req.query("type_document");

  // Sécurisation de la pagination contre NaN et valeurs < 1
  const rawPage = parseInt(c.req.query("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const rawLimit = parseInt(c.req.query("limit") || "50", 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100);

  const offset = (page - 1) * limit;
  const conditions = [eq(catalogues.archived, false)];

  // Filtrage par filiale
  if (filialeFilter) {
    const fid = await resolveFilialeId(filialeFilter);
    if (fid === null) {
      // Filiale non trouvée => Retourner directement un résultat vide
      return success(c, {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
    conditions.push(eq(catalogues.filiale, fid));
  }

  // Filtrage par type de document
  if (typeFilter) {
    conditions.push(
      eq(
        catalogues.type_document,
        typeFilter as
          | "catalogue"
          | "brochure"
          | "plaquette"
          | "fiche_technique"
          | "autre",
      ),
    );
  }

  // Requête principale
  const rows = await db
    .select({
      id: catalogues.id,
      titre: catalogues.titre,
      filiale: catalogues.filiale,
      filiale_nom: filiales.nom,
      type_document: catalogues.type_document,
      file_path: catalogues.file_path,
      taille_ko: catalogues.taille_ko,
      format: catalogues.format,
      telechargements: catalogues.telechargements,
      archived: catalogues.archived,
      created_at: catalogues.created_at,
      updated_at: catalogues.updated_at,
    })
    .from(catalogues)
    .leftJoin(filiales, eq(catalogues.filiale, filiales.id))
    .where(and(...conditions))
    .orderBy(desc(catalogues.created_at))
    .limit(limit)
    .offset(offset);

  // Compte total des résultats
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(catalogues)
    .where(and(...conditions));

  const total = Number(countResult?.count || 0);

  return success(c, {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/v1/catalogues/:id/download - Increment download count
cataloguesRoutes.get("/:id/download", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return error(c, "ID invalide", 400);
  }

  const [catalogue] = await db
    .select()
    .from(catalogues)
    .where(and(eq(catalogues.id, id), eq(catalogues.archived, false)))
    .limit(1);

  if (!catalogue) {
    return error(c, "Catalogue non trouvé", 404);
  }

  // Incrémentation sécurisée gérant les valeurs NULL éventuelles
  await db
    .update(catalogues)
    .set({
      telechargements: sql`COALESCE(${catalogues.telechargements}, 0) + 1`,
      updated_at: new Date(),
    })
    .where(eq(catalogues.id, id));

  const currentDownloads = Number(catalogue.telechargements || 0);

  return success(c, {
    file_path: catalogue.file_path,
    telechargements: currentDownloads + 1,
  });
});

export default cataloguesRoutes;
