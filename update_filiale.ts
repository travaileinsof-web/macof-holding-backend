import { db } from "./src/db/client";
import { filiales } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating MACOF Print & Com SARL image...");
  
  await db.update(filiales).set({
    image_url: "https://media.istockphoto.com/id/1492549645/photo/black-friday-shoppers-tired-of-waiting.jpg?s=612x612&w=0&k=20&c=WAUcS_XmMOQ9ZhVR7NwOxm9fXjxgZmuST468rRIQv3s="
  }).where(eq(filiales.slug, "print"));

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
