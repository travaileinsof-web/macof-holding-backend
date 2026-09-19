import { db } from "./src/db/client";
import { page_contents } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("Adding 10 testimonials to the database...");

  const temoignages = [
    {
      nom: "Ousmane Barry",
      poste: "Directeur des Opérations",
      entreprise: "Guinée Mining Corporation",
      message: "Le partenariat avec MACOF Mining a été un véritable catalyseur pour nos activités d'extraction. Leur rigueur logistique et le respect strict des normes de sécurité sont incomparables.",
      avatar_url: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Aïssatou Diallo",
      poste: "CEO",
      entreprise: "Global Trade Africa",
      message: "En tant qu'importatrice de premier plan, confier notre chaîne d'approvisionnement à MACOF Transit a été notre meilleure décision. Nos délais de livraison ont été optimisés de façon exceptionnelle.",
      avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Mamadou Sylla",
      poste: "Architecte en Chef",
      entreprise: "Sylla & Partners",
      message: "Nous collaborons avec MACOF Immobilier sur des projets d'infrastructures majeurs à Conakry. Leur capacité à exécuter des travaux complexes tout en respectant les délais est tout simplement bluffante.",
      avatar_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Fanta Camara",
      poste: "Directrice Financière",
      entreprise: "Banque Panafricaine",
      message: "Le niveau de gouvernance et la transparence de MACOF Holding rassurent les investisseurs. C'est un modèle de gestion que beaucoup d'entreprises locales devraient suivre.",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Ibrahima Touré",
      poste: "Responsable Logistique",
      entreprise: "Agro-Export Guinée",
      message: "Le service client de MACOF Transit est disponible H24. Lors de nos dernières exportations maritimes, ils ont géré les formalités douanières avec un professionnalisme exemplaire.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Mariam Keita",
      poste: "Event Manager",
      entreprise: "Élite Événements",
      message: "Pour nos galas d'entreprise, SEBA International (MACOF Restauration) est notre traiteur exclusif. La qualité de leurs mets et la présentation sont dignes de la haute gastronomie.",
      avatar_url: "https://images.unsplash.com/photo-1531123414708-506927a4d46b?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Sékou Traoré",
      poste: "Président de la Coopérative",
      entreprise: "Pêcheurs Associés de l'Atlantique",
      message: "MACOF Fishing valorise nos ressources marines tout en respectant l'environnement. Leurs investissements dans la chaîne du froid ont sauvé notre industrie locale.",
      avatar_url: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Fatoumata Condé",
      poste: "Directrice Marketing",
      entreprise: "Tech Innovation GN",
      message: "L'identité visuelle de notre dernière campagne a été entièrement conçue et imprimée par MACOF Print & Com. Qualité d'impression premium et créativité débordante !",
      avatar_url: "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Alpha Yaya Soumah",
      poste: "Investisseur Privé",
      entreprise: "Fonds Soumah & Co",
      message: "Acquérir des biens à travers MACOF Immobilier est synonyme de sécurité et de rentabilité. Leurs résidences offrent un standing de classe internationale.",
      avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200"
    },
    {
      nom: "Binta Bah",
      poste: "Consultante en Stratégie",
      entreprise: "Bah Consulting",
      message: "La synergie entre les différentes filiales de MACOF Holding est impressionnante. C'est un acteur économique robuste et visionnaire pour la Guinée de demain.",
      avatar_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200"
    }
  ];

  // Upsert into page_contents for page_slug = 'home' and section_key = 'temoignages'
  const existingRecords = await db.select().from(page_contents).where(and(eq(page_contents.page_slug, "home"), eq(page_contents.section_key, "temoignages")));
  const existing = existingRecords[0];

  if (existing) {
    await db.update(page_contents).set({
      content_value: JSON.stringify(temoignages),
      content_type: "json",
      updated_at: new Date()
    }).where(eq(page_contents.id, existing.id));
    console.log("Updated existing temoignages entry.");
  } else {
    await db.insert(page_contents).values({
      page_slug: "home",
      section_key: "temoignages",
      content_value: JSON.stringify(temoignages),
      content_type: "json"
    });
    console.log("Inserted new temoignages entry.");
  }

  console.log("Done. 10 testimonials successfully added to DB.");
  process.exit(0);
}

main().catch(console.error);
