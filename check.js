const { db } = require('./dist/db/client.js');
const { sql } = require('drizzle-orm');

async function run() {
  try {
    const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'demandes_contact'`);
    console.log("Columns:", res.rows.map(r => r.column_name).join(", "));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
