import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  const res = await sql`select content_value from page_contents where page_slug = 'home' and section_key = 'temoignages'`;
  if (res.length > 0) {
    let json = res[0].content_value;
    json = json.replace("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7", "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f");
    await sql`update page_contents set content_value = ${json} where page_slug = 'home' and section_key = 'temoignages'`;
    console.log("Updated temoignages!");
  }
}
main();
