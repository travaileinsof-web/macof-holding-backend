import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const pages = await sql`SELECT section_key, content_value FROM page_contents WHERE page_slug = 'home' AND section_key IN ('temoignages', 'realisations')`;
  console.log('--- PAGE CONTENTS ---');
  console.log(JSON.stringify(pages, null, 2));

  const galerie = await sql`SELECT * FROM galerie`;
  console.log('--- GALERIE ---');
  console.log(JSON.stringify(galerie, null, 2));
}

main().catch(console.error);
