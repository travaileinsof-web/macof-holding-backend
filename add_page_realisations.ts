import { db } from "./src/db/client";
import { page_contents, filiales } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Fetching filiales...");
  const filialesList = await db.select().from(filiales);

  const realisationsData: Record<string, any[]> = {
    "immobilier": [
      { id: "1", title: "Résidence Océan", desc: "Complexe résidentiel haut de gamme de 45 appartements avec vue sur la mer.", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop" },
      { id: "2", title: "Tour Commerciale MACOF", desc: "Construction de bureaux modernes au cœur de Kaloum.", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop" }
    ],
    "restauration": [
      { id: "3", title: "Gala des Entreprises", desc: "Prestation de traiteur premium pour plus de 500 invités.", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop" },
      { id: "4", title: "Service Traiteur VIP", desc: "Menus sur-mesure pour les événements diplomatiques.", image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop" }
    ],
    "mining": [
      { id: "5", title: "Mine de Bauxite Alpha", desc: "Infrastructure d'extraction optimisée et écologique.", image: "https://image.pollinations.ai/prompt/mining%20quarry%20industrial%20heavy%20machinery?width=2000&height=1200&nologo=true" }
    ],
    "print": [
      { id: "6", title: "Campagne Visuelle Panafricaine", desc: "Impression et déploiement de 200 panneaux grand format.", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop" }
    ],
    "transit": [
      { id: "7", title: "Flotte Logistique", desc: "Déploiement d'une nouvelle flotte de transport de fret.", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop" }
    ],
    "fishing": [
      { id: "8", title: "Navires Haute-Mer", desc: "Acquisition de chalutiers nouvelle génération.", image: "https://image.pollinations.ai/prompt/large%20industrial%20fishing%20vessel%20in%20ocean%20nets?width=2000&height=1200&nologo=true" }
    ]
  };

  for (const f of filialesList) {
    const slug = f.slug;
    const items = realisationsData[slug] || [];

    if (items.length > 0) {
      const existingRecords = await db.select().from(page_contents).where(and(eq(page_contents.page_slug, slug), eq(page_contents.section_key, "realisations")));
      const existing = existingRecords[0];

      if (existing) {
        await db.update(page_contents).set({
          content_value: JSON.stringify(items),
          content_type: "json",
          updated_at: new Date()
        }).where(eq(page_contents.id, existing.id));
        console.log(`Updated realisations for ${slug}`);
      } else {
        await db.insert(page_contents).values({
          page_slug: slug,
          section_key: "realisations",
          content_value: JSON.stringify(items),
          content_type: "json"
        });
        console.log(`Inserted realisations for ${slug}`);
      }
    }
  }

  console.log("Done updating realisations par filiale.");
  process.exit(0);
}

main().catch(console.error);
