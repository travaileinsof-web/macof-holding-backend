require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Truncating tables...');
  try {
    await sql`TRUNCATE TABLE page_contents, settings, chatbot_logs, galerie, catalogues, demandes_contact, administrateurs, filiales CASCADE`;
    console.log('All tables truncated successfully.');
  } catch (err) {
    console.error('Error truncating tables:', err);
    process.exit(1);
  }
}

run();
