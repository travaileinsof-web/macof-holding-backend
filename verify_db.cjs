require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function verify() {
  const tables = [
    'page_contents',
    'settings',
    'chatbot_logs',
    'galerie',
    'catalogues',
    'demandes_contact',
    'administrateurs',
    'filiales'
  ];

  console.log('--- DB VERIFICATION REPORT ---');
  for (const table of tables) {
    try {
      const result = await sql.query("SELECT COUNT(*) as count FROM " + table);
      console.log("Table '" + table + "': " + result.rows[0].count + " rows");
    } catch (err) {
      console.error(`Error querying table '${table}': ${err.message}`);
    }
  }
  console.log('------------------------------');
}

verify();
