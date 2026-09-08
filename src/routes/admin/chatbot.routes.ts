// src/routes/admin/chatbot.routes.ts
import { Hono } from "hono";
import { handleVoiceCommand } from "../../services/chatbot.service";
import { success, error } from "../../utils/response";
import { authMiddleware } from "../../middleware/auth";

export const adminChatbotRoutes = new Hono();
adminChatbotRoutes.use("*", authMiddleware);

adminChatbotRoutes.post("/voice", async (c) => {
  try {
    const { sessionId, transcript } = await c.req.json();

    if (!sessionId || !transcript) {
      return error(c, "sessionId et transcript sont obligatoires", 400);
    }

    const result = await handleVoiceCommand(sessionId, transcript);
    return success(c, result, "Commande vocale traitée avec succès");
  } catch (err: any) {
    console.error("Erreur commande vocale :", err);
    return error(c, err.message || "Erreur interne", 500);
  }
});
