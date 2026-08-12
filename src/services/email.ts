import nodemailer from "nodemailer";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema";

export interface SmtpConfig {
  host: string;
  port: number;
  email: string;
  password: string;
}

// Helper pour sécuriser le contenu HTML contre les injections
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");
}

/**
 * Récupère la configuration SMTP.
 * Priorité : Base de données > Fichier .env > Valeurs par défaut
 */
async function getSmtpConfig(): Promise<SmtpConfig> {
  try {
    const keys = ["smtp_host", "smtp_port", "smtp_email", "smtp_password"];
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, keys));

    const configMap = new Map(rows.map((r) => [r.key, r.value]));

    return {
      host:
        configMap.get("smtp_host") || process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(
        configMap.get("smtp_port") || process.env.SMTP_PORT || "587",
        10,
      ),
      email: configMap.get("smtp_email") || process.env.SMTP_EMAIL || "",
      // Nettoyage automatique des espaces éventuels dans le mot de passe d'application Gmail
      password: (
        configMap.get("smtp_password") ||
        process.env.SMTP_PASSWORD ||
        ""
      ).replace(/\s+/g, ""),
    };
  } catch (error) {
    // Si la BDD est inaccessible, lecture directe du .env
    return {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      email: process.env.SMTP_EMAIL || "",
      password: (process.env.SMTP_PASSWORD || "").replace(/\s+/g, ""),
    };
  }
}

/**
 * Envoie un email générique via Nodemailer
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { from?: string; replyTo?: string },
): Promise<boolean> {
  const smtpConfig = await getSmtpConfig();

  if (!smtpConfig.host || !smtpConfig.email || !smtpConfig.password) {
    console.warn("[SMTP] Configuration incomplète. Email non envoyé.", {
      to,
      subject,
    });
    return false;
  }

  const isSecure = smtpConfig.port === 465;

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: isSecure, // true pour 465, false pour 587
    auth: {
      user: smtpConfig.email,
      pass: smtpConfig.password,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  try {
    await transporter.sendMail({
      from: options?.from || `"MACOF Holding" <${smtpConfig.email}>`,
      to,
      subject,
      html,
      replyTo: options?.replyTo,
    });
    console.log(`[SMTP] Email envoyé avec succès à ${to} : "${subject}"`);
    return true;
  } catch (error) {
    console.error("[SMTP Error] Erreur lors de l'envoi de l'email :", error);
    return false;
  }
}

/**
 * Construit et envoie l'email de notification de demande de contact à l'admin
 */
export async function sendNotificationEmail(demande: {
  reference: string;
  nom_complet: string;
  email: string;
  telephone?: string | null;
  societe?: string | null;
  fonction?: string | null;
  objet?: string | null;
  message: string;
  filiale?: string | null;
}): Promise<boolean> {
  let recipient = process.env.NOTIFICATION_EMAIL;

  // Si non défini dans .env, tentative de récupération en BDD
  if (!recipient) {
    try {
      const [notifEmail] = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, "notification_email"));
      recipient = notifEmail?.value;
    } catch {
      // Ignoré
    }
  }

  // Destinataire par défaut
  recipient = recipient || "macofholding2018@gmail.com";

  // Sanitisation des données entrantes
  const safeRef = escapeHtml(demande.reference);
  const safeNom = escapeHtml(demande.nom_complet);
  const safeEmail = escapeHtml(demande.email);
  const safeTel = escapeHtml(demande.telephone);
  const safeSociete = escapeHtml(demande.societe);
  const safeFonction = escapeHtml(demande.fonction);
  const safeObjet = escapeHtml(demande.objet);
  const safeFiliale = escapeHtml(demande.filiale);
  const safeMessage = escapeHtml(demande.message);

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a365d, #2d3748); color: white; padding: 20px 30px; }
        .header h1 { margin: 0; font-size: 22px; }
        .header p { margin: 5px 0 0; opacity: 0.9; }
        .content { padding: 25px 30px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #4a5568; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-value { color: #2d3748; margin-top: 3px; padding: 8px 12px; background: #f7fafc; border-radius: 4px; border-left: 3px solid #1a365d; }
        .footer { background: #edf2f7; padding: 15px 30px; text-align: center; font-size: 12px; color: #718096; }
        .badge { display: inline-block; padding: 3px 10px; background: #ebf8ff; color: #2b6cb0; border-radius: 12px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvelle demande de contact</h1>
          <p>Référence: <span class="badge">${safeRef}</span></p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Nom complet</div>
            <div class="field-value">${safeNom}</div>
          </div>
          ${
            demande.societe
              ? `
          <div class="field">
            <div class="field-label">Société</div>
            <div class="field-value">${safeSociete}</div>
          </div>`
              : ""
          }
          ${
            demande.fonction
              ? `
          <div class="field">
            <div class="field-label">Fonction</div>
            <div class="field-value">${safeFonction}</div>
          </div>`
              : ""
          }
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${safeEmail}</div>
          </div>
          ${
            demande.telephone
              ? `
          <div class="field">
            <div class="field-label">Téléphone</div>
            <div class="field-value">${safeTel}</div>
          </div>`
              : ""
          }
          ${
            demande.objet
              ? `
          <div class="field">
            <div class="field-label">Objet</div>
            <div class="field-value">${safeObjet}</div>
          </div>`
              : ""
          }
          ${
            demande.filiale
              ? `
          <div class="field">
            <div class="field-label">Filiale concernée</div>
            <div class="field-value">${safeFiliale}</div>
          </div>`
              : ""
          }
          <div class="field">
            <div class="field-label">Message</div>
            <div class="field-value">${safeMessage}</div>
          </div>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le site MACOF Holding.</p>
          <p>&copy; ${new Date().getFullYear()} MACOF Holding - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `[MACOF Holding] Nouvelle demande - ${demande.reference} - ${demande.nom_complet}`;

  return sendEmail(recipient, subject, html, {
    replyTo: demande.email,
  });
}
