import { db } from './src/db/client.js';
import { demandes_contact, settings } from './src/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function run() {
  try {
    console.log("Testing parameterized query...");
    const existing = await db.select().from(settings).where(eq(settings.key, 'smtp_host')).limit(1);
    console.log("Settings query:", existing);

    const [nouvellesDemandes] = await db
        .select()
        .from(demandes_contact)
        .where(and(eq(demandes_contact.archived, false), eq(demandes_contact.statut, 'nouveau')));
    console.log("Demandes query:", nouvellesDemandes);

  } catch(e) {
    console.error("Error executing query:", e);
  }
  process.exit(0);
}
run();
