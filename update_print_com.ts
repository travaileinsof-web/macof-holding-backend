import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  await sql`update filiales set image_url = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop' where slug = 'print'`;
  console.log("Updated print & com image!");
}
main();
