const dotenv = require('dotenv');
dotenv.config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const countQueries = {
  page_contents: () => sql`SELECT COUNT(*) AS count FROM page_contents`,
  settings: () => sql`SELECT COUNT(*) AS count FROM settings`,
  chatbot_logs: () => sql`SELECT COUNT(*) AS count FROM chatbot_logs`,
  galerie: () => sql`SELECT COUNT(*) AS count FROM galerie`,
  catalogues: () => sql`SELECT COUNT(*) AS count FROM catalogues`,
  demandes_contact: () => sql`SELECT COUNT(*) AS count FROM demandes_contact`,
  administrateurs: () => sql`SELECT COUNT(*) AS count FROM administrateurs`,
  filiales: () => sql`SELECT COUNT(*) AS count FROM filiales`,
  produits_menu: () => sql`SELECT COUNT(*) AS count FROM produits_menu`,
  commandes: () => sql`SELECT COUNT(*) AS count FROM commandes`,
  lignes_commandes: () => sql`SELECT COUNT(*) AS count FROM lignes_commandes`,
  temoignages: () => sql`SELECT COUNT(*) AS count FROM temoignages`,
};

let hasErrors = false;

async function verify() {
  const tables = [
    'page_contents',
    'settings',
    'chatbot_logs',
    'galerie',
    'catalogues',
    'demandes_contact',
    'administrateurs',
    'filiales',
    'produits_menu',
    'commandes',
    'lignes_commandes',
    'temoignages'
  ];

  console.log('--- DB VERIFICATION REPORT ---');
  for (const table of tables) {
    try {
      const result = await countQueries[table]();
      console.log("Table '" + table + "': " + (result[0]?.count ?? 0) + " rows");
    } catch (err) {
      hasErrors = true;
      console.error(`Error querying table '${table}': ${err.message}`);
    }
  }
  console.log('------------------------------');
  process.exitCode = hasErrors ? 1 : 0;
}

verify();
