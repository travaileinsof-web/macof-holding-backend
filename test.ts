import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  try {
    const res = await sql`select * from filiales where archived = false`;
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
main();
