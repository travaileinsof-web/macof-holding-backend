import { db } from "./src/db/client";
import { galerie, filiales } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Fetching filiales...");
  const filialesList = await db.select().from(filiales);
  
  const getFilialeId = (slug: string) => filialesList.find(f => f.slug === slug)?.id || null;

  const realisations = [
    {
      titre: "Résidence Océan",
      filiale: getFilialeId("immobilier"),
      type_projet: "residentiel" as const,
      lieu: "Kipé, Conakry",
      date_realisation: "Octobre 2025",
      description_courte: "Complexe résidentiel haut de gamme de 45 appartements avec vue sur la mer et sécurité 24/7.",
      image_path: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop"
    },
    {
      titre: "Gala des Entreprises",
      filiale: getFilialeId("restauration"),
      type_projet: "evenement" as const,
      lieu: "Hôtel Kaloum",
      date_realisation: "Décembre 2025",
      description_courte: "Prestation de traiteur premium pour plus de 500 invités lors du sommet économique annuel.",
      image_path: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop"
    },
    {
      titre: "Mine de Bauxite Alpha",
      filiale: getFilialeId("mining"),
      type_projet: "production" as const,
      lieu: "Boké",
      date_realisation: "En cours",
      description_courte: "Déploiement d'une infrastructure d'extraction optimisée respectant les dernières normes écologiques.",
      image_path: "https://image.pollinations.ai/prompt/mining%20quarry%20industrial%20heavy%20machinery?width=2000&height=1200&nologo=true"
    },
    {
      titre: "Campagne Visuelle Panafricaine",
      filiale: getFilialeId("print"),
      type_projet: "commercial" as const,
      lieu: "Conakry",
      date_realisation: "Janvier 2026",
      description_courte: "Impression et déploiement de plus de 200 panneaux publicitaires grand format.",
      image_path: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop"
    },
    {
      titre: "Flotte Logistique Internationale",
      filiale: getFilialeId("transit"),
      type_projet: "logistique" as const,
      lieu: "Port Autonome de Conakry",
      date_realisation: "2025",
      description_courte: "Mise en service d'une nouvelle flotte de transport de fret couvrant l'Afrique de l'Ouest.",
      image_path: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop"
    },
    {
      titre: "Navires de Pêche Industrielle",
      filiale: getFilialeId("fishing"),
      type_projet: "production" as const,
      lieu: "Océan Atlantique",
      date_realisation: "Février 2026",
      description_courte: "Acquisition de 3 navires équipés de technologies de congélation à bord dernière génération.",
      image_path: "https://image.pollinations.ai/prompt/large%20industrial%20fishing%20vessel%20in%20ocean%20nets?width=2000&height=1200&nologo=true"
    },
    {
      titre: "Tour Commerciale MACOF",
      filiale: getFilialeId("immobilier"),
      type_projet: "infrastructure" as const,
      lieu: "Kaloum, Conakry",
      date_realisation: "Mars 2026",
      description_courte: "Construction de bureaux modernes abritant les sièges de plusieurs multinationales.",
      image_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
    },
    {
      titre: "Service Traiteur VIP",
      filiale: getFilialeId("restauration"),
      type_projet: "evenement" as const,
      lieu: "Ambassades",
      date_realisation: "Continu",
      description_courte: "Menus sur-mesure et service impeccable pour le corps diplomatique en Guinée.",
      image_path: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  console.log("Inserting realisations...");
  for (const item of realisations) {
    if (item.filiale) {
      await db.insert(galerie).values(item);
      console.log(`Inserted: ${item.titre}`);
    } else {
      console.log(`Skipped (filiale not found): ${item.titre}`);
    }
  }

  console.log("Done adding realisations to Galerie.");
  process.exit(0);
}

main().catch(console.error);
