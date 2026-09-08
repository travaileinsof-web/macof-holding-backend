// src/services/chatbot.service.ts
import {
  modifierPrixProduitParNom,
  changerDisponibiliteProduitParNom,
  modifierStatutCommandeParRef,
  modifierStatutDemandeParRef,
  modifierStatutFilialeParNom,
} from "./adminActions.service";
import { db } from "../db/client";
import { chatbot_logs } from "../db/schema";
import { chatbotTools } from "./chatbotTools.service";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export const FREE_GEMINI_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
] as const;

const DEFAULT_FREE_GEMINI_MODEL = "gemini-2.5-flash";

function buildGeminiUrl(modelName: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
}

export async function handleVoiceCommand(
  sessionId: string,
  transcript: string,
) {
  let message = "Commande exécutée.";
  let intention = "commande_vocal";
  let actionResult: any = null;
  let filialeOrientee: number | null = null;
  let rawResponse: any = null;

  try {
    const modelName = DEFAULT_FREE_GEMINI_MODEL;

    const res = await fetch(buildGeminiUrl(modelName), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: transcript }] }],
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: "Tu es l'assistant vocal d'administration du back-office. Exécute directement les actions demandées via les outils sans demander confirmation. Réponds de façon concise.",
            },
          ],
        },
        tools: chatbotTools,
        toolConfig: {
          functionCallingConfig: { mode: "ANY" },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    rawResponse = await res.json();

    const candidate = rawResponse?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const textPart = parts.find((p: any) => typeof p.text === "string");
    if (textPart?.text) message = textPart.text;

    const functionCallPart = parts.find((p: any) => p.functionCall);

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      const resolvedName = typeof name === "string" ? name : "commande_vocal";
      const actionArgs = (args ?? {}) as Record<string, any>;
      intention = resolvedName;

      if (resolvedName === "mettre_a_jour_prix_produit") {
        const nomProduit =
          typeof actionArgs.nom_produit === "string"
            ? actionArgs.nom_produit
            : "";
        const nouveauPrix = Number(actionArgs.nouveau_prix_gnf ?? 0);
        actionResult = await modifierPrixProduitParNom(nomProduit, nouveauPrix);
      } else if (resolvedName === "changer_disponibilite_produit") {
        const nomProduit =
          typeof actionArgs.nom_produit === "string"
            ? actionArgs.nom_produit
            : "";
        const disponible = Boolean(actionArgs.disponible);
        actionResult = await changerDisponibiliteProduitParNom(
          nomProduit,
          disponible,
        );
      } else if (resolvedName === "modifier_statut_commande") {
        const referenceCommande =
          typeof actionArgs.reference_commande === "string"
            ? actionArgs.reference_commande
            : "";
        const statut = actionArgs.statut as any;
        actionResult = await modifierStatutCommandeParRef(
          referenceCommande,
          statut,
        );
      } else if (resolvedName === "modifier_statut_demande_contact") {
        const referenceDemande =
          typeof actionArgs.reference_demande === "string"
            ? actionArgs.reference_demande
            : "";
        const statut = actionArgs.statut as any;
        actionResult = await modifierStatutDemandeParRef(
          referenceDemande,
          statut,
        );
      } else if (resolvedName === "modifier_statut_filiale") {
        const nomFiliale =
          typeof actionArgs.nom_filiale === "string"
            ? actionArgs.nom_filiale
            : "";
        const statut = actionArgs.statut as any;
        actionResult = await modifierStatutFilialeParNom(nomFiliale, statut);
        if (actionResult?.data) filialeOrientee = actionResult.data.id;
      }

      if (actionResult) {
        message = actionResult.message;
      }
    } else {
      console.warn(
        "[chatbot.service:handleVoiceCommand] Aucun functionCall reçu, réponse texte seule.",
        rawResponse,
      );
    }

    // Insertion conforme à la structure de la table chatbot_logs
    await db.insert(chatbot_logs).values({
      session_id: sessionId,
      intention_detectee: intention,
      filiale_orientee: filialeOrientee,
      statut_resolution: actionResult?.success ? "resolu" : "non_resolu",
      conversation_json: {
        user_transcript: transcript,
        ai_response: message,
        executed_action: actionResult || null,
        raw_gemini_response: rawResponse,
      },
    });

    return { message, actionResult };
  } catch (error) {
    console.error("[chatbot.service:handleVoiceCommand]", error);

    // On tente quand même de logguer l'échec, sans faire planter le retour si ça échoue aussi
    try {
      await db.insert(chatbot_logs).values({
        session_id: sessionId,
        intention_detectee: "erreur",
        filiale_orientee: null,
        statut_resolution: "non_resolu",
        conversation_json: {
          user_transcript: transcript,
          error: error instanceof Error ? error.message : String(error),
          raw_gemini_response: rawResponse,
        },
      });
    } catch (logError) {
      console.error(
        "[chatbot.service:handleVoiceCommand] Erreur lors de l'insertion du log d'échec:",
        logError,
      );
    }

    return {
      message:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors du traitement vocal.",
      actionResult: { success: false, message: "Erreur chatbot" },
    };
  }
}
