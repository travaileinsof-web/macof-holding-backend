import { db } from "./src/db/client";
import { produits_menu } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Cleaning old plats...");

  const plats = [
    {
      nom: "Filet de Bœuf Rossini",
      description: "Tendre filet de bœuf poêlé, foie gras frais, sauce aux truffes noires et pommes fondantes.",
      categorie: "plats" as const,
      prix_gnf: 350000,
      image_url: "https://images.unsplash.com/photo-1544025162-831e64ffdf38?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/3195394/3195394-uhd_3840_2160_25fps.mp4"
    },
    {
      nom: "Saumon Grillé à l'Aneth",
      description: "Pavé de saumon frais de l'Atlantique, asperges croquantes et sauce mousseline au citron.",
      categorie: "plats" as const,
      prix_gnf: 280000,
      image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/2822244/2822244-uhd_3840_2160_24fps.mp4"
    },
    {
      nom: "Poulet Yassa Premium",
      description: "Volaille fermière marinée au citron et oignons confits, riz parfumé au jasmin et pointe de piment.",
      categorie: "plats" as const,
      prix_gnf: 180000,
      image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/3209211/3209211-uhd_3840_2160_25fps.mp4"
    },
    {
      nom: "Risotto aux Fruits de Mer",
      description: "Riz Arborio crémeux, crevettes tigrées, calamars, moules fraîches et parmesan affiné.",
      categorie: "plats" as const,
      prix_gnf: 240000,
      image_url: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/5520930/5520930-uhd_3840_2160_30fps.mp4"
    },
    {
      nom: "Tartare de Thon Rouge",
      description: "Thon rouge finement coupé, avocat avocat, sésame torréfié et vinaigrette au yuzu.",
      categorie: "plats" as const,
      prix_gnf: 220000,
      image_url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/8550186/8550186-uhd_3840_2160_25fps.mp4"
    },
    {
      nom: "Magret de Canard au Miel",
      description: "Magret rôti aux épices douces, purée de patates douces et légumes glacés de saison.",
      categorie: "plats" as const,
      prix_gnf: 310000,
      image_url: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/2822244/2822244-uhd_3840_2160_24fps.mp4"
    },
    {
      nom: "Linguine aux Truffes",
      description: "Pâtes fraîches artisanales, crème onctueuse aux truffes d'Alba et copeaux de truffe fraîche.",
      categorie: "plats" as const,
      prix_gnf: 290000,
      image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/3209211/3209211-uhd_3840_2160_25fps.mp4"
    },
    {
      nom: "Côte de Boeuf Tomahawk",
      description: "Pièce d'exception maturée 30 jours, grillée au feu de bois, accompagnée de frites maison.",
      categorie: "plats" as const,
      prix_gnf: 650000,
      image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
      video_url: "https://videos.pexels.com/video-files/3195394/3195394-uhd_3840_2160_25fps.mp4"
    }
  ];

  for (const p of plats) {
    await db.insert(produits_menu).values(p);
  }

  console.log("8 Plats gastronomiques insérés avec succès !");
  process.exit(0);
}

main().catch(console.error);
