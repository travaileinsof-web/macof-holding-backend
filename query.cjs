const { Client } = require('pg');
const client = new Client('postgresql://neondb_owner:npg_HVqK5hjQn7uF@ep-rough-bird-ayomyi9a-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require');
client.connect().then(() => {
  return client.query("SELECT section_key, content_value FROM page_contents WHERE page_slug = 'home' AND section_key IN ('temoignages', 'realisations')");
}).then(res => {
  console.log(JSON.stringify(res.rows, null, 2));
  return client.query("SELECT * FROM galerie");
}).then(res => {
  console.log('--- GALERIE ---');
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(console.error);
