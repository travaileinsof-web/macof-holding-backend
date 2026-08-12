import { Hono } from "hono";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { db } from "../db/client";
import { galerie, filiales } from "../db/schema";
import { success, error } from "../utils/response";

const galerieRoutes = new Hono();

// Helper optimisé : 1 seule requête SQL avec or()
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

// GET /api/v1/galerie - List gallery items with filiale name (public)
galerieRoutes.get("/", async (c) => {
  const filialeFilter = c.req.query("filiale");
  const typeFilter = c.req.query("type_projet");

  // Sécurisation contre NaN et valeurs négatives
  const rawPage = parseInt(c.req.query("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const rawLimit = parseInt(c.req.query("limit") || "50", 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 100);

  const offset = (page - 1) * limit;
  const conditions = [eq(galerie.archived, false)];

  // Gestion du filtre filiale
  if (filialeFilter) {
    const fid = await resolveFilialeId(filialeFilter);
    if (fid === null) {
      // Filiale non trouvée => Retourner directement un tableau vide
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
    conditions.push(eq(galerie.filiale, fid));
  }

  if (typeFilter) {
    conditions.push(
      eq(
        galerie.type_projet,
        typeFilter as
          | "residentiel"
          | "commercial"
          | "infrastructure"
          | "evenement"
          | "production"
          | "logistique"
          | "autre",
      ),
    );
  }

  // Requête principale
  const rows = await db
    .select({
      id: galerie.id,
      titre: galerie.titre,
      filiale: galerie.filiale,
      filiale_nom: filiales.nom,
      type_projet: galerie.type_projet,
      lieu: galerie.lieu,
      date_realisation: galerie.date_realisation,
      description_courte: galerie.description_courte,
      image_path: galerie.image_path,
      archived: galerie.archived,
      created_at: galerie.created_at,
      updated_at: galerie.updated_at,
    })
    .from(galerie)
    .leftJoin(filiales, eq(galerie.filiale, filiales.id))
    .where(and(...conditions))
    .orderBy(desc(galerie.created_at))
    .limit(limit)
    .offset(offset);

  // Compte total sécurisé
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(galerie)
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

// GET /api/v1/galerie/:id - Get single gallery item (public)
galerieRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return error(c, "ID invalide", 400);
  }

  const [row] = await db
    .select({
      id: galerie.id,
      titre: galerie.titre,
      filiale: galerie.filiale,
      filiale_nom: filiales.nom,
      type_projet: galerie.type_projet,
      lieu: galerie.lieu,
      date_realisation: galerie.date_realisation,
      description_courte: galerie.description_courte,
      image_path: galerie.image_path,
      archived: galerie.archived,
      created_at: galerie.created_at,
      updated_at: galerie.updated_at,
    })
    .from(galerie)
    .leftJoin(filiales, eq(galerie.filiale, filiales.id))
    .where(and(eq(galerie.id, id), eq(galerie.archived, false)))
    .limit(1);

  if (!row) {
    return error(c, "Élément de galerie non trouvé", 404);
  }

  return success(c, row);
});

export default galerieRoutes;
