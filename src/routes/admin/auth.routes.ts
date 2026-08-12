import { Hono } from "hono";
import { eq, count, desc, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { administrateurs, catalogues, demandes_contact, filiales, galerie, page_contents, settings } from "../../db/schema";
import { deleteFile, uploadFile } from "../../services/upload";


// Helpers pour les reponses standardisees
const success = (c: any, data: any, message = "Succes", status = 200) => {
  return c.json({ success: true, message, data }, status);
};

const error = (c: any, message = "Erreur", status = 400) => {
  return c.json({ success: false, message }, status);
};

// ─── 1. Dashboard Router ────────────────────────────────────────────────────
export const adminDashboard = new Hono();

adminDashboard.get("/", async (c) => {
  const [demandesCount] = await db
    .select({ value: count() })
    .from(demandes_contact);
  const [filialesCount] = await db.select({ value: count() }).from(filiales);
  const [galerieCount] = await db.select({ value: count() }).from(galerie);
  const [cataloguesCount] = await db
    .select({ value: count() })
    .from(catalogues);

  return success(c, {
    demandes: demandesCount.value,
    filiales: filialesCount.value,
    galerie: galerieCount.value,
    catalogues: cataloguesCount.value,
  });
});

// ─── 2. Demandes de Contact Router ──────────────────────────────────────────
export const adminDemandes = new Hono();

adminDemandes.get("/", async (c) => {
  const list = await db
    .select()
    .from(demandes_contact)
    .orderBy(desc(demandes_contact.created_at));

  return success(c, list);
});

adminDemandes.put("/:id/status", async (c) => {
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json();

  const updated = await db
    .update(demandes_contact)
    .set({
      statut: status,
      updated_at: new Date(),
    })
    .where(eq(demandes_contact.id, id))
    .returning();

  if (!updated.length) return error(c, "Demande introuvable", 404);
  return success(c, updated[0], "Statut mis a jour");
});

// ─── 3. Filiales Router ─────────────────────────────────────────────────────
export const adminFiliales = new Hono();

adminFiliales.get("/", async (c) => {
  const list = await db.select().from(filiales);
  return success(c, list);
});

adminFiliales.post("/", async (c) => {
  const body = await c.req.json();
  const created = await db.insert(filiales).values(body).returning();
  return success(c, created[0], "Filiale creee", 201);
});

adminFiliales.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const updated = await db
    .update(filiales)
    .set({
      ...body,
      updated_at: new Date(),
    })
    .where(eq(filiales.id, id))
    .returning();

  if (!updated.length) return error(c, "Filiale introuvable", 404);
  return success(c, updated[0], "Filiale mise a jour");
});

adminFiliales.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(filiales).where(eq(filiales.id, id));
  return success(c, null, "Filiale supprimee");
});

// ─── 4. Galerie Router ──────────────────────────────────────────────────────
export const adminGalerie = new Hono();

adminGalerie.get("/", async (c) => {
  const items = await db.select().from(galerie);
  return success(c, items);
});

adminGalerie.post("/", async (c) => {
  const body = await c.req.json();
  const item = await db.insert(galerie).values(body).returning();
  return success(c, item[0], "Image ajoutee", 201);
});

adminGalerie.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const [item] = await db.select().from(galerie).where(eq(galerie.id, id));

  if (item?.image_path) {
    await deleteFile(item.image_path).catch(() => {});
  }

  await db.delete(galerie).where(eq(galerie.id, id));
  return success(c, null, "Element supprime de la galerie");
});

// ─── 5. Catalogues Router ───────────────────────────────────────────────────
export const adminCatalogues = new Hono();

adminCatalogues.get("/", async (c) => {
  const items = await db.select().from(catalogues);
  return success(c, items);
});

adminCatalogues.post("/", async (c) => {
  const body = await c.req.json();
  const created = await db.insert(catalogues).values(body).returning();
  return success(c, created[0], "Catalogue cree", 201);
});

adminCatalogues.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const updated = await db
    .update(catalogues)
    .set({
      ...body,
      updated_at: new Date(),
    })
    .where(eq(catalogues.id, id))
    .returning();

  if (!updated.length) return error(c, "Catalogue introuvable", 404);
  return success(c, updated[0], "Catalogue mis a jour");
});

adminCatalogues.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const [item] = await db
    .select()
    .from(catalogues)
    .where(eq(catalogues.id, id));

  if (item?.file_path) {
    await deleteFile(item.file_path).catch(() => {});
  }

  await db.delete(catalogues).where(eq(catalogues.id, id));
  return success(c, null, "Catalogue supprime");
});

// ─── 6. CMS Page Contents Router ───────────────────────────────────────────
export const adminPages = new Hono();

adminPages.get("/", async (c) => {
  const list = await db.select().from(page_contents);
  return success(c, list);
});

adminPages.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const list = await db
    .select()
    .from(page_contents)
    .where(eq(page_contents.page_slug, slug));

  return success(c, list);
});

adminPages.post("/bulk", async (c) => {
  const body = await c.req.json();
  const pageSlug = body?.page_slug;
  const contents = Array.isArray(body?.contents) ? body.contents : [];

  if (!pageSlug || contents.length === 0) {
    return error(c, "Données de page invalides", 400);
  }

  const filteredContents = contents
    .filter((item: any) => item && item.section_key && item.content_value !== undefined)
    .map((item: any) => ({
      page_slug: String(pageSlug),
      section_key: String(item.section_key),
      content_value: String(item.content_value),
      content_type: item.content_type ? String(item.content_type) : "text",
      updated_at: new Date(),
    }));

  if (filteredContents.length === 0) {
    return error(c, "Aucun contenu de page valide fourni", 400);
  }

  try {
    await db
      .insert(page_contents)
      .values(filteredContents)
      .onConflictDoUpdate({
        target: [page_contents.page_slug, page_contents.section_key],
        set: {
          content_value: sql`EXCLUDED.content_value`,
          content_type: sql`EXCLUDED.content_type`,
          updated_at: sql`CURRENT_TIMESTAMP`,
        },
      });

    return success(c, { updated: filteredContents.length }, "Contenu de page mis à jour avec succès");
  } catch (err) {
    console.error("Erreur admin/pages/bulk:", err);
    return error(c, "Impossible de sauvegarder le contenu de page", 500);
  }
});

adminPages.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const updated = await db
    .update(page_contents)
    .set({
      ...body,
      updated_at: new Date(),
    })
    .where(eq(page_contents.id, id))
    .returning();

  if (!updated.length) return error(c, "Section introuvable", 404);
  return success(c, updated[0], "Contenu de page mis a jour");
});

// ─── 7. Settings Router ─────────────────────────────────────────────────────
export const adminSettings = new Hono();

adminSettings.get("/", async (c) => {
  const list = await db.select().from(settings);
  return success(c, list);
});

adminSettings.put("/:key", async (c) => {
  const key = c.req.param("key");
  const { value } = await c.req.json();

  const updated = await db
    .update(settings)
    .set({
      value,
      updated_at: new Date(),
    })
    .where(eq(settings.key, key))
    .returning();

  if (!updated.length) return error(c, "Parametre introuvable", 404);
  return success(c, updated[0], "Parametre mis a jour");
});

// ─── 8. Profile Administrateur Router ───────────────────────────────────────
export const adminProfile = new Hono();

adminProfile.get("/", async (c) => {
  const userId = (c as any).get("jwtPayload")?.id;
  if (!userId) return error(c, "Non autorise", 401);

  const [user] = await db
    .select({
      id: administrateurs.id,
      nom: administrateurs.nom,
      email: administrateurs.email,
      role: administrateurs.role,
      filiale_attribuee: administrateurs.filiale_attribuee,
      created_at: administrateurs.created_at,
    })
    .from(administrateurs)
    .where(eq(administrateurs.id, userId));

  if (!user) return error(c, "Utilisateur introuvable", 404);
  return success(c, user);
});

adminProfile.put("/", async (c) => {
  const userId = (c as any).get("jwtPayload")?.id;
  if (!userId) return error(c, "Non autorise", 401);

  const body = await c.req.json();

  // On empeche la modification directe du password_hash ici
  delete body.password_hash;

  const [updated] = await db
    .update(administrateurs)
    .set({
      ...body,
      updated_at: new Date(),
    })
    .where(eq(administrateurs.id, userId))
    .returning();

  return success(c, updated, "Profil mis a jour");
});

// ─── 9. Upload Router ───────────────────────────────────────────────────────
export const adminUpload = new Hono();

adminUpload.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File;
  const folder = (body["folder"] as string) || "uploads";

  if (!file) {
    return error(c, "Aucun fichier fourni", 400);
  }

  const url = await uploadFile(file, folder);

  return success(
    c,
    {
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    },
    "Fichier televerse avec succes",
    201,
  );
});

// ─── 10. Router Principal Administration ────────────────────────────────────
export const adminRoutes = new Hono();

adminRoutes.route("/dashboard/stats", adminDashboard);
adminRoutes.route("/demandes", adminDemandes);
adminRoutes.route("/filiales", adminFiliales);
adminRoutes.route("/galerie", adminGalerie);
adminRoutes.route("/catalogues", adminCatalogues);
adminRoutes.route("/pages", adminPages);
adminRoutes.route("/settings", adminSettings);
adminRoutes.route("/profile", adminProfile);
adminRoutes.route("/upload", adminUpload);

export default adminRoutes;
