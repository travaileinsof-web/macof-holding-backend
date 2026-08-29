import { Hono } from "hono";
import { and, desc, eq, inArray } from "drizzle-orm";
import { createHmac } from "node:crypto";
import { db } from "../db/client";
import {
  commandes,
  lignes_commandes,
  produits_menu,
  settings,
  type Commande,
  type NewCommande,
  type LigneCommande,
} from "../db/schema";

type NewLigneCommande = Omit<LigneCommande, "id">;
import { success, error } from "../utils/response";
import { authMiddleware } from "../middleware/auth";
import { uploadFile } from "../services/upload";
import { eventEmitter } from "../services/events";

const restaurationRoutes = new Hono();
export const adminRestaurationRoutes = new Hono();
adminRestaurationRoutes.use("*", authMiddleware);

adminRestaurationRoutes.get("/menu", async (c) => {
  const products = await db
    .select()
    .from(produits_menu)
    .orderBy(desc(produits_menu.created_at));
  return success(c, products);
});

async function parseMenuBody(c: any) {
  const contentType = c.req.header("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    const body: any = Object.fromEntries(
      Object.entries(form).filter(([key]) => key !== "image"),
    );
    const image = form.image instanceof File ? form.image : undefined;
    if (image) body.image_url = await uploadFile(image, "restauration");
    return body;
  }
  return await c.req.json();
}

function normalizeMenuBody(body: any) {
  const normalized: any = {
    nom: String(body.nom || "").trim(),
    description: body.description ? String(body.description) : null,
    categorie: body.categorie,
    prix_gnf: Number(body.prix_gnf),
    disponible: body.disponible === true || body.disponible === "true",
    updated_at: new Date(),
  };
  if (body.image_url) normalized.image_url = String(body.image_url);
  return normalized;
}

adminRestaurationRoutes.post("/menu", async (c) => {
  const body = normalizeMenuBody(await parseMenuBody(c));
  if (!body.nom || !Number.isFinite(body.prix_gnf) || !body.categorie)
    return error(c, "Données de produit invalides", 400);
  const [product] = await db.insert(produits_menu).values(body).returning();
  eventEmitter.emit("invalidate", { entity: "restauration" });
  return success(c, product, "Produit ajouté", 201);
});

adminRestaurationRoutes.put("/menu/:id", async (c) => {
  const body = normalizeMenuBody(await parseMenuBody(c));
  const [product] = await db
    .update(produits_menu)
    .set(body)
    .where(eq(produits_menu.id, Number(c.req.param("id"))))
    .returning();
  if (product) eventEmitter.emit("invalidate", { entity: "restauration" });
  return product
    ? success(c, product, "Produit mis à jour")
    : error(c, "Produit introuvable", 404);
});

adminRestaurationRoutes.delete("/menu/:id", async (c) => {
  const [product] = await db
    .update(produits_menu)
    .set({ archived: true, updated_at: new Date() })
    .where(eq(produits_menu.id, Number(c.req.param("id"))))
    .returning();
  if (product) eventEmitter.emit("invalidate", { entity: "restauration" });
  return product
    ? success(c, product, "Produit supprimé")
    : error(c, "Produit introuvable", 404);
});

adminRestaurationRoutes.get("/commandes", async (c) => {
  const orders = await db
    .select()
    .from(commandes)
    .orderBy(desc(commandes.created_at));
  if (orders.length === 0) return success(c, []);

  const orderIds = orders.map((o) => o.id);

  // Jointure lignes_commandes -> produits_menu pour récupérer l'image de
  // chaque article commandé. leftJoin car produit_id est nullable
  // (produit supprimé du menu depuis la commande) — dans ce cas image_url
  // vaut simplement null et le frontend affiche déjà un fallback.
  const lignes = await db
    .select({
      commande_id: lignes_commandes.commande_id,
      nom_produit: lignes_commandes.nom_produit,
      quantite: lignes_commandes.quantite,
      image_url: produits_menu.image_url,
    })
    .from(lignes_commandes)
    .leftJoin(produits_menu, eq(lignes_commandes.produit_id, produits_menu.id))
    .where(inArray(lignes_commandes.commande_id, orderIds));

  const lignesParCommande = new Map<number, typeof lignes>();
  for (const ligne of lignes) {
    const liste = lignesParCommande.get(ligne.commande_id) ?? [];
    liste.push(ligne);
    lignesParCommande.set(ligne.commande_id, liste);
  }

  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: (lignesParCommande.get(order.id) ?? []).map((l) => ({
      nom: l.nom_produit,
      quantite: l.quantite,
      image_url: l.image_url ?? undefined,
    })),
  }));

  return success(c, ordersWithItems);
});

adminRestaurationRoutes.put("/commandes/:id/statut", async (c) => {
  const { statut } = await c.req.json();
  const [order] = await db
    .update(commandes)
    .set({ statut, updated_at: new Date() })
    .where(eq(commandes.id, Number(c.req.param("id"))))
    .returning();
  return order
    ? success(c, order, "Statut mis à jour")
    : error(c, "Commande introuvable", 404);
});

adminRestaurationRoutes.put("/commandes/:id/paiement", async (c) => {
  const { statut_paiement } = await c.req.json();
  const [order] = await db
    .update(commandes)
    .set({ statut_paiement, updated_at: new Date() })
    .where(eq(commandes.id, Number(c.req.param("id"))))
    .returning();
  return order
    ? success(c, order, "Paiement mis à jour")
    : error(c, "Commande introuvable", 404);
});

// ─── Types Djomy ─────────────────────────────────────────────────────────────

interface DjomyAuthResponse {
  success?: boolean;
  message?: string;
  data?: {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
  };
}

interface DjomyPaymentResponse {
  success?: boolean;
  message?: string;
  data?: {
    redirectUrl?: string;
    transactionId?: string;
    id?: string;
  };
}

interface DjomyVerifyResponse {
  success?: boolean;
  message?: string;
  data?: {
    status?: string;
    paymentStatus?: string;
  };
}

type DjomyPaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | (string & {}); // fallback si Djomy ajoute d'autres statuts

interface DjomyPaymentResult {
  paymentUrl: string;
  transactionId: string | null;
}

// ─── Types panier / body ─────────────────────────────────────────────────────

interface CartItemInput {
  productId: number;
  quantity: number;
}

interface CreateCommandeBody {
  nom_client: string;
  telephone: string;
  email?: string;
  adresse_livraison: string;
  quartier: string;
  ville: string;
  mode_paiement?: "livraison" | "djomy";
  notes?: string;
  items: CartItemInput[];
}

interface ParsedCartItem {
  id: number;
  quantity: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function reference(): string {
  return `SEBA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function getSetting(key: string, fallback: number): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  const value = Number(row?.value);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function buildDjomyApiKey(clientId: string, clientSecret: string): string {
  const signature = createHmac("sha256", clientSecret)
    .update(clientId)
    .digest("hex");
  return `${clientId}:${signature}`;
}

/**
 * 🔐 Génère dynamiquement le DJOMY_JWT_TOKEN requis pour les requêtes
 */
async function fetchDjomyToken(): Promise<string> {
  const clientId = process.env.DJOMY_CLIENT_ID;
  const clientSecret = process.env.DJOMY_CLIENT_SECRET;
  const baseUrl = process.env.DJOMY_API_URL || "https://djomy.africa";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Configuration Djomy incomplète : DJOMY_CLIENT_ID et DJOMY_CLIENT_SECRET sont requis.",
    );
  }

  const apiKeyHeader = buildDjomyApiKey(clientId, clientSecret);

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/auth`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKeyHeader,
      "Content-Type": "application/json",
    },
  }).catch((networkError) => {
    console.error("Erreur réseau vers Djomy /v1/auth :", networkError);
    throw networkError;
  });

  const result: DjomyAuthResponse = await response
    .json()
    .catch(() => ({}) as DjomyAuthResponse);

  const accessToken = result.data?.accessToken;

  if (!response.ok || !accessToken) {
    throw new Error(
      result.message || "Impossible de récupérer le token d'accès Djomy.",
    );
  }

  return accessToken;
}

/**
 * 💳 Initialise le paiement via la passerelle de redirection (Hosted Gateway)
 */
async function createDjomyPayment(
  order: Commande,
  frontendUrl: string,
): Promise<DjomyPaymentResult> {
  const clientId = process.env.DJOMY_CLIENT_ID;
  const clientSecret = process.env.DJOMY_CLIENT_SECRET;
  const baseUrl = process.env.DJOMY_API_URL || "https://djomy.africa";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Configuration Djomy incomplète pour l'initialisation du paiement.",
    );
  }

  const jwtToken = await fetchDjomyToken();

  // Djomy attend le numéro au format international complet : 00 + indicatif + numéro local
  const localDigits = order.telephone.replace(/\D/g, "").replace(/^0+/, "");
  const payerNumber = `00224${localDigits}`;

  const payload = {
    amount: order.acompte_gnf,
    countryCode: "GN",
    payerNumber,
    description: `Commande ${order.reference}`,
    merchantPaymentReference: order.reference,
    returnUrl: `${frontendUrl.replace(/\/$/, "")}/checkout?commande=${order.reference}`,
    cancelUrl: `${frontendUrl.replace(/\/$/, "")}/checkout?paiement=annule&commande=${order.reference}`,
    metadata: {
      orderId: order.reference,
      customerPhone: order.telephone,
    },
  };

  const body = JSON.stringify(payload);
  const apiKeyHeader = buildDjomyApiKey(clientId, clientSecret);

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/v1/payments/gateway`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "X-API-KEY": apiKeyHeader,
      },
      body,
    },
  );

  const result: DjomyPaymentResponse = await response
    .json()
    .catch(() => ({}) as DjomyPaymentResponse);

  const paymentUrl = result.data?.redirectUrl;
  const transactionId = result.data?.transactionId || result.data?.id || null;

  if (!response.ok || !paymentUrl) {
    throw new Error(
      result.message || "Djomy n'a pas fourni d'URL de paiement.",
    );
  }

  return {
    paymentUrl,
    transactionId,
  };
}

/**
 * 🔍 Vérifie le statut d'une transaction existante auprès de Djomy
 */
async function verifyDjomyPayment(
  transactionId: string,
): Promise<DjomyPaymentStatus> {
  const clientId = process.env.DJOMY_CLIENT_ID;
  const clientSecret = process.env.DJOMY_CLIENT_SECRET;
  const baseUrl = process.env.DJOMY_API_URL || "https://djomy.africa";

  if (!clientId || !clientSecret) {
    throw new Error("Configuration Djomy incomplète.");
  }

  const jwtToken = await fetchDjomyToken();
  const path = `/v1/payments/${encodeURIComponent(transactionId)}/verify`;
  const apiKeyHeader = buildDjomyApiKey(clientId, clientSecret);

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      "X-API-KEY": apiKeyHeader,
    },
  });

  const result: DjomyVerifyResponse = await response
    .json()
    .catch(() => ({}) as DjomyVerifyResponse);

  if (!response.ok)
    throw new Error("Vérification de la transaction Djomy impossible.");

  return String(
    result.data?.status || result.data?.paymentStatus || "",
  ).toUpperCase();
}

/**
 * 📋 Public Routes: Menu Catalogue
 */
restaurationRoutes.get("/menu", async (c) => {
  try {
    const products = await db
      .select({
        id: produits_menu.id,
        nom: produits_menu.nom,
        description: produits_menu.description,
        prix_gnf: produits_menu.prix_gnf,
        image_url: produits_menu.image_url,
        disponible: produits_menu.disponible,
        archived: produits_menu.archived,
      })
      .from(produits_menu)
      .where(
        and(
          eq(produits_menu.archived, false),
          eq(produits_menu.disponible, true),
        ),
      );
    return success(c, products);
  } catch (err: any) {
    return error(
      c,
      `Erreur lors de la récupération du menu: ${err.message}`,
      500,
    );
  }
});

restaurationRoutes.get("/menu/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const [product] = await db
      .select({
        id: produits_menu.id,
        nom: produits_menu.nom,
        description: produits_menu.description,
        prix_gnf: produits_menu.prix_gnf,
        image_url: produits_menu.image_url,
        disponible: produits_menu.disponible,
        archived: produits_menu.archived,
      })
      .from(produits_menu)
      .where(
        and(
          eq(produits_menu.id, id),
          eq(produits_menu.archived, false),
          eq(produits_menu.disponible, true),
        ),
      )
      .limit(1);
    return product ? success(c, product) : error(c, "Produit introuvable", 404);
  } catch (err: any) {
    return error(c, `Erreur produit: ${err.message}`, 500);
  }
});

/**
 * 🛒 Public Route: Post & Create Food Orders
 */
restaurationRoutes.post("/commandes", async (c) => {
  const body = await c.req
    .json<Partial<CreateCommandeBody>>()
    .catch(() => null);

  if (
    !body?.nom_client ||
    !body?.telephone ||
    !body?.adresse_livraison ||
    !body?.quartier ||
    !body?.ville ||
    !Array.isArray(body.items) ||
    !body.items.length
  ) {
    return error(c, "Informations client et panier obligatoires.", 422);
  }

  const requested: ParsedCartItem[] = body.items.map((item) => ({
    id: Number(item.productId),
    quantity: Number(item.quantity),
  }));

  if (
    requested.some(
      (item) =>
        !Number.isInteger(item.id) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99,
    )
  ) {
    return error(c, "Panier invalide.", 422);
  }

  const ids = requested.map((item) => item.id);

  try {
    // Targeted fields lookup: bypasses reading the problematic 'categorie' enum column
    const products = await db
      .select({
        id: produits_menu.id,
        nom: produits_menu.nom,
        prix_gnf: produits_menu.prix_gnf,
      })
      .from(produits_menu)
      .where(
        and(
          inArray(produits_menu.id, ids),
          eq(produits_menu.archived, false),
          eq(produits_menu.disponible, true),
        ),
      );

    if (products.length !== new Set(ids).size) {
      return error(c, "Un produit du panier n'est plus disponible.", 409);
    }

    const subtotal = requested.reduce((sum, item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      return sum + (product ? product.prix_gnf * item.quantity : 0);
    }, 0);

    const deliveryFee = await getSetting("restauration_frais_livraison_gnf", 0);
    const depositPercent = Math.min(
      100,
      await getSetting("restauration_acompte_pourcent", 30),
    );
    const total = subtotal + deliveryFee;
    const isDjomy = body.mode_paiement === "djomy";
    const deposit = isDjomy ? Math.ceil((total * depositPercent) / 100) : 0;

    const orderInput: NewCommande = {
      reference: reference(),
      nom_client: String(body.nom_client).trim(),
      telephone: String(body.telephone).trim(),
      email: body.email ? String(body.email).trim() : null,
      adresse_livraison: String(body.adresse_livraison).trim(),
      quartier: String(body.quartier).trim(),
      ville: String(body.ville).trim(),
      frais_livraison_gnf: deliveryFee,
      total_gnf: total,
      acompte_pourcent: depositPercent,
      acompte_gnf: deposit,
      reste_gnf: total - deposit,
      mode_paiement: isDjomy ? "djomy" : "livraison",
      statut_paiement: isDjomy ? "en_attente" : "a_payer",
      notes: body.notes ? String(body.notes).trim() : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [created]: Commande[] = await db
      .insert(commandes)
      .values(orderInput)
      .returning();

    if (!created) {
      return error(c, "Impossible de créer la commande.", 500);
    }

    const ligneValues: NewLigneCommande[] = requested.map((item) => {
      const product = products.find((candidate) => candidate.id === item.id)!;
      return {
        commande_id: created.id,
        produit_id: product.id,
        nom_produit: product.nom,
        prix_unitaire_gnf: product.prix_gnf,
        quantite: item.quantity,
        total_gnf: product.prix_gnf * item.quantity,
      };
    });

    await db.insert(lignes_commandes).values(ligneValues);

    // Initializing dynamic payment redirection via Djomy Gateway
    if (created.mode_paiement === "djomy") {
      try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const payment = await createDjomyPayment(created, frontendUrl);

        await db
          .update(commandes)
          .set({
            djomy_transaction_id: payment.transactionId,
            updated_at: new Date(),
          })
          .where(eq(commandes.id, created.id));

        return success(
          c,
          {
            ...created,
            djomy_transaction_id: payment.transactionId,
            paymentUrl: payment.paymentUrl,
          },
          undefined,
          201,
        );
      } catch (paymentError: any) {
        // 🐛 TEMPORAIRE : voir la vraie cause de l'échec Djomy
        console.error("Échec initialisation paiement Djomy :", paymentError);

        // Le paiement n'a pas pu être initialisé : on annule la commande
        // pour éviter de bloquer un client avec une commande impayable.
        await db
          .delete(lignes_commandes)
          .where(eq(lignes_commandes.commande_id, created.id));
        await db.delete(commandes).where(eq(commandes.id, created.id));

        return error(
          c,
          `Commande annulée : ${
            paymentError.message ||
            "le paiement Djomy n'a pas pu être initialisé."
          }`,
          502,
        );
      }
    }

    return success(c, created, undefined, 201);
  } catch (err: any) {
    return error(
      c,
      `Erreur lors de la création de la commande: ${err.message}`,
      500,
    );
  }
});

/**
 * 🔍 Public Route: Vérifie le statut réel d'une commande auprès de Djomy
 * (double vérification serveur-à-serveur, ne jamais se fier au seul retour d'URL)
 */
restaurationRoutes.get("/commandes/:reference/statut", async (c) => {
  try {
    const reference = c.req.param("reference");

    const [order] = await db
      .select()
      .from(commandes)
      .where(eq(commandes.reference, reference))
      .limit(1);

    if (!order) {
      return error(c, "Commande introuvable.", 404);
    }

    // Paiement à la livraison : pas de vérification Djomy à faire
    if (order.mode_paiement !== "djomy") {
      return success(c, {
        reference: order.reference,
        statut_paiement: order.statut_paiement,
        statut: order.statut,
      });
    }

    if (!order.djomy_transaction_id) {
      return success(c, {
        reference: order.reference,
        statut_paiement: order.statut_paiement,
        statut: order.statut,
      });
    }

    // Déjà confirmé en base, pas besoin de re-vérifier auprès de Djomy
    if (order.statut_paiement === "paye") {
      return success(c, {
        reference: order.reference,
        statut_paiement: order.statut_paiement,
        statut: order.statut,
      });
    }

    const djomyStatus = await verifyDjomyPayment(order.djomy_transaction_id);

    let nouveauStatutPaiement: Commande["statut_paiement"] =
      order.statut_paiement;
    if (djomyStatus === "SUCCESS" || djomyStatus === "COMPLETED") {
      nouveauStatutPaiement = "paye";
    } else if (djomyStatus === "FAILED") {
      nouveauStatutPaiement = "echec";
    } else if (djomyStatus === "CANCELLED") {
      nouveauStatutPaiement = "echec";
    }
    // Sinon (PENDING ou statut inconnu) : on laisse l'état actuel inchangé

    if (nouveauStatutPaiement !== order.statut_paiement) {
      await db
        .update(commandes)
        .set({
          statut_paiement: nouveauStatutPaiement,
          statut: nouveauStatutPaiement === "paye" ? "confirmee" : order.statut,
          updated_at: new Date(),
        })
        .where(eq(commandes.id, order.id));
    }

    return success(c, {
      reference: order.reference,
      statut_paiement: nouveauStatutPaiement,
      statut: nouveauStatutPaiement === "paye" ? "confirmee" : order.statut,
    });
  } catch (err: any) {
    return error(
      c,
      `Erreur lors de la vérification du statut: ${err.message}`,
      500,
    );
  }
});

/**
 * 🪝 Webhook Route: Receives asynchronous payment notifications from Djomy
 * POST /restauration/djomy-webhook
 * Validates signature and updates order payment status
 */
restaurationRoutes.post("/djomy-webhook", async (c) => {
  try {
    // Extract the request body (raw JSON)
    const rawBody = await c.req.text();
    const body = JSON.parse(rawBody);

    // Extract signature from headers
    const signatureHeader = c.req.header("X-Djomy-Signature");
    if (!signatureHeader) {
      console.warn("Djomy webhook: Missing X-Djomy-Signature header");
      return error(c, "Missing signature", 400);
    }

    // Validate signature
    const clientSecret = process.env.DJOMY_CLIENT_SECRET;
    if (!clientSecret) {
      console.error("Djomy webhook: DJOMY_CLIENT_SECRET not configured");
      return error(c, "Server configuration error", 500);
    }

    const expectedSignature = createHmac("sha256", clientSecret)
      .update(rawBody)
      .digest("hex");

    if (signatureHeader !== expectedSignature) {
      console.warn(
        `Djomy webhook: Invalid signature. Expected ${expectedSignature}, got ${signatureHeader}`,
      );
      return error(c, "Invalid signature", 401);
    }

    // Extract webhook data
    const { transactionId, status, merchantPaymentReference } = body;

    if (!transactionId || !status || !merchantPaymentReference) {
      console.warn("Djomy webhook: Missing required fields", body);
      return error(c, "Missing required fields", 400);
    }

    // Map Djomy status to our status
    let nouveauStatutPaiement: Commande["statut_paiement"] = "en_attente";
    if (status === "SUCCESS" || status === "COMPLETED") {
      nouveauStatutPaiement = "paye";
    } else if (status === "FAILED") {
      nouveauStatutPaiement = "echec";
    } else if (status === "CANCELLED") {
      nouveauStatutPaiement = "echec";
    }

    // Update order in database
    const [order] = await db
      .select()
      .from(commandes)
      .where(eq(commandes.reference, merchantPaymentReference))
      .limit(1);

    if (!order) {
      console.warn(
        `Djomy webhook: Order not found for reference ${merchantPaymentReference}`,
      );
      // Return 200 to acknowledge receipt (idempotency)
      return success(c, { acknowledged: true });
    }

    // Only update if status changed
    if (nouveauStatutPaiement !== order.statut_paiement) {
      await db
        .update(commandes)
        .set({
          statut_paiement: nouveauStatutPaiement,
          statut: nouveauStatutPaiement === "paye" ? "confirmee" : order.statut,
          updated_at: new Date(),
        })
        .where(eq(commandes.id, order.id));

      console.log(
        `✅ Djomy webhook: Order ${merchantPaymentReference} updated to ${nouveauStatutPaiement}`,
      );
    }

    // Always return 200 OK to acknowledge receipt
    return success(c, { acknowledged: true });
  } catch (err: any) {
    console.error("Djomy webhook error:", err);
    // Always return 200 to prevent Djomy from retrying
    return success(c, { acknowledged: true });
  }
});

export default restaurationRoutes;
