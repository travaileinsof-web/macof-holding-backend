import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { settings } from '../db/schema';

async function getWhatsAppNumber(): Promise<string> {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, 'whatsapp_number'));
    return row?.value || '+224625744626';
  } catch {
    return '+224625744626';
  }
}

export function generateWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
}

export async function generateContactWhatsAppUrl(demande: {
  nom_complet: string;
  email: string;
  telephone?: string | null;
  societe?: string | null;
  objet?: string | null;
  message: string;
  filiale?: string | null;
}): Promise<string> {
  const whatsappNumber = await getWhatsAppNumber();

  const formattedMessage = [
    `*Nouvelle demande de contact MACOF Holding*`,
    ``,
    `*Nom:* ${demande.nom_complet}`,
    demande.societe ? `*Société:* ${demande.societe}` : null,
    demande.email ? `*Email:* ${demande.email}` : null,
    demande.telephone ? `*Téléphone:* ${demande.telephone}` : null,
    demande.filiale ? `*Filiale:* ${demande.filiale}` : null,
    demande.objet ? `*Objet:* ${demande.objet}` : null,
    ``,
    `*Message:*`,
    demande.message,
  ]
    .filter(Boolean)
    .join('\n');

  return generateWhatsAppUrl(whatsappNumber, formattedMessage);
}
