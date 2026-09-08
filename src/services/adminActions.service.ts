// src/services/adminActions.service.ts
import { db } from "../db/client";
import {
  produits_menu,
  commandes,
  demandes_contact,
  filiales,
  statutCommandeEnum,
  statutDemandeEnum,
  statutFilialeEnum,
} from "../db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { eventEmitter } from "./events";

function buildDebugError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  console.error(`[adminActions:${context}]`, error);
  return {
    success: false,
    message: `${context}: ${message}`,
  };
}

// ─── RESTAURANT / MENU ──────────────────────────────────────────────────────

export async function modifierPrixProduitParNom(
  nomProduit: string,
  nouveauPrixGnf: number,
) {
  try {
    const matches = await db
      .select()
      .from(produits_menu)
      .where(
        and(
          ilike(produits_menu.nom, `%${nomProduit.trim()}%`),
          eq(produits_menu.archived, false),
        ),
      );

    if (matches.length === 0)
      return {
        success: false,
        message: `Aucun produit correspondant à "${nomProduit}".`,
      };
    if (matches.length > 1)
      return {
        success: false,
        message: `Plusieurs produits trouvés pour "${nomProduit}". Précisez le nom exact.`,
      };

    const target = matches[0];
    const [updated] = await db
      .update(produits_menu)
      .set({ prix_gnf: nouveauPrixGnf, updated_at: new Date() })
      .where(eq(produits_menu.id, target.id))
      .returning();

    eventEmitter.emit("invalidate", { entity: "restauration" });
    return {
      success: true,
      message: `Le prix de "${updated.nom}" a été mis à jour à ${nouveauPrixGnf} GNF.`,
      data: updated,
    };
  } catch (error) {
    return buildDebugError("modifierPrixProduitParNom", error);
  }
}

export async function changerDisponibiliteProduitParNom(
  nomProduit: string,
  disponible: boolean,
) {
  try {
    const matches = await db
      .select()
      .from(produits_menu)
      .where(
        and(
          ilike(produits_menu.nom, `%${nomProduit.trim()}%`),
          eq(produits_menu.archived, false),
        ),
      );

    if (matches.length === 0)
      return {
        success: false,
        message: `Aucun produit correspondant à "${nomProduit}".`,
      };
    if (matches.length > 1)
      return {
        success: false,
        message: `Plusieurs produits trouvés pour "${nomProduit}". Précisez le nom.`,
      };

    const target = matches[0];
    const [updated] = await db
      .update(produits_menu)
      .set({ disponible, updated_at: new Date() })
      .where(eq(produits_menu.id, target.id))
      .returning();

    eventEmitter.emit("invalidate", { entity: "restauration" });
    return {
      success: true,
      message: `Le produit "${updated.nom}" est désormais ${disponible ? "disponible" : "indisponible"}.`,
      data: updated,
    };
  } catch (error) {
    return buildDebugError("changerDisponibiliteProduitParNom", error);
  }
}

// ─── COMMANDES ───────────────────────────────────────────────────────────────

export async function modifierStatutCommandeParRef(
  reference: string,
  statut: (typeof statutCommandeEnum.enumValues)[number],
) {
  try {
    const [order] = await db
      .update(commandes)
      .set({ statut, updated_at: new Date() })
      .where(ilike(commandes.reference, `%${reference.trim()}%`))
      .returning();

    if (!order)
      return { success: false, message: `Commande "${reference}" introuvable.` };

    eventEmitter.emit("invalidate", { entity: "restauration" });
    return {
      success: true,
      message: `Le statut de la commande ${order.reference} passe à "${statut}".`,
      data: order,
    };
  } catch (error) {
    return buildDebugError("modifierStatutCommandeParRef", error);
  }
}

// ─── DEMANDES DE CONTACT ────────────────────────────────────────────────────

export async function modifierStatutDemandeParRef(
  reference: string,
  statut: (typeof statutDemandeEnum.enumValues)[number],
) {
  try {
    const [demande] = await db
      .update(demandes_contact)
      .set({ statut, updated_at: new Date() })
      .where(ilike(demandes_contact.reference, `%${reference.trim()}%`))
      .returning();

    if (!demande)
      return { success: false, message: `Demande "${reference}" introuvable.` };

    eventEmitter.emit("invalidate", { entity: "contact" });
    return {
      success: true,
      message: `Le statut de la demande ${demande.reference} passe à "${statut}".`,
      data: demande,
    };
  } catch (error) {
    return buildDebugError("modifierStatutDemandeParRef", error);
  }
}

// ─── FILIALES ────────────────────────────────────────────────────────────────

export async function modifierStatutFilialeParNom(
  nomFiliale: string,
  statut: (typeof statutFilialeEnum.enumValues)[number],
) {
  try {
    const matches = await db
      .select()
      .from(filiales)
      .where(
        and(
          ilike(filiales.nom, `%${nomFiliale.trim()}%`),
          eq(filiales.archived, false),
        ),
      );

    if (matches.length === 0)
      return { success: false, message: `Filiale "${nomFiliale}" introuvable.` };
    if (matches.length > 1)
      return {
        success: false,
        message: `Plusieurs filiales trouvées pour "${nomFiliale}".`,
      };

    const target = matches[0];
    const [updated] = await db
      .update(filiales)
      .set({ statut, updated_at: new Date() })
      .where(eq(filiales.id, target.id))
      .returning();

    eventEmitter.emit("invalidate", { entity: "filiales" });
    return {
      success: true,
      message: `La filiale "${updated.nom}" est désormais ${statut}.`,
      data: updated,
    };
  } catch (error) {
    return buildDebugError("modifierStatutFilialeParNom", error);
  }
}
