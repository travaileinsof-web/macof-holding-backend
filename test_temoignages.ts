import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  const res = await sql`select * from page_contents where page_slug = 'home' and section_key = 'temoignages'`;
  console.log(res);
}
main();
