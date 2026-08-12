import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_HVqK5hjQn7uF@ep-rough-bird-ayomyi9a-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const pages = await sql`SELECT section_key, content_value FROM page_contents WHERE page_slug = 'home' AND section_key IN ('temoignages', 'realisations')`;
  console.log('--- PAGE CONTENTS ---');
  console.log(JSON.stringify(pages, null, 2));

  const galerie = await sql`SELECT * FROM galerie`;
  console.log('--- GALERIE ---');
  console.log(JSON.stringify(galerie, null, 2));
}

main().catch(console.error);
