import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { demandes_contact, filiales } from "../db/schema";
import { success, error } from "../utils/response";
import { demandeSchema } from "../utils/validation";
import { sendNotificationEmail } from "../services/email";
import { generateContactWhatsAppUrl } from "../services/whatsapp";

const contactRoutes = new Hono();

// Helper de lecture sécurisée du body HTTP (JSON ou FormData)
async function parseBody(c: any) {
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

// Génération d'une référence unique sécurisée
function generateReference(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()
    .padStart(4, "X");
  return `DM-${year}${month}${day}-${random}`;
}

// POST /api/contact - Soumission du formulaire de contact public
contactRoutes.post("/", async (c) => {
  const body = await parseBody(c);
  if (!body) {
    return error(c, "Données de formulaire invalides ou illisibles", 400);
  }

  const parsed = demandeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Données invalides";
    return error(c, message, 422);
  }

  const data = parsed.data;
  const reference = generateReference();

  // Résolution de la filiale (par ID, Slug ou Nom)
  let filialeName: string | null = null;
  let filialeId: number | null = null;

  if (data.filiale) {
    const filialeValue = String(data.filiale).trim();
    const isNumber = /^\d+$/.test(filialeValue);

    if (isNumber) {
      const [filiale] = await db
        .select({ id: filiales.id, nom: filiales.nom })
        .from(filiales)
        .where(eq(filiales.id, parseInt(filialeValue, 10)))
        .limit(1);

      if (filiale) {
        filialeName = filiale.nom;
        filialeId = filiale.id;
      }
    } else {
      // Recherche par slug OU par nom en 1 seule requête
      const [filiale] = await db
        .select({ id: filiales.id, nom: filiales.nom })
        .from(filiales)
        .where(
          or(eq(filiales.slug, filialeValue), eq(filiales.nom, filialeValue)),
        )
        .limit(1);

      if (filiale) {
        filialeName = filiale.nom;
        filialeId = filiale.id;
      } else {
        filialeName = filialeValue;
      }
    }
  }

  // Insertion de la demande en BDD
  await db.insert(demandes_contact).values({
    reference,
    civilite: data.civilite || null,
    nom_complet: data.nom_complet,
    email: data.email,
    telephone: data.telephone || null,
    societe: data.societe || null,
    fonction: data.fonction || null,
    filiale: filialeId,
    type_demande: data.type_demande || "information",
    objet: data.objet || null,
    message: data.message,
    details_json:
      data.details_json && Object.keys(data.details_json).length > 0
        ? (data.details_json as Record<string, unknown>)
        : null,
  });

  // Envoi de la notification par e-mail (non-bloquant)
  sendNotificationEmail({
    reference,
    nom_complet: data.nom_complet,
    email: data.email,
    telephone: data.telephone,
    societe: data.societe,
    fonction: data.fonction,
    objet: data.objet,
    message: data.message,
    filiale: filialeName,
  }).catch((err) => {
    console.error("Erreur envoi notification email:", err);
  });

  // Génération résiliente de l'URL WhatsApp
  let whatsappUrl: string | null = null;
  try {
    whatsappUrl = await generateContactWhatsAppUrl({
      nom_complet: data.nom_complet,
      email: data.email,
      telephone: data.telephone,
      societe: data.societe,
      objet: data.objet,
      message: data.message,
      filiale: filialeName,
    });
  } catch (err) {
    console.error("Erreur génération URL WhatsApp:", err);
  }

  return success(
    c,
    {
      reference,
      whatsapp_url: whatsappUrl,
    },
    `Votre demande a été envoyée avec succès. Référence: ${reference}`,
    201,
  );
});

export default contactRoutes;
