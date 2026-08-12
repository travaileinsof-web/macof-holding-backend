import { db } from "./client";
import {
  administrateurs,
  filiales,
  page_contents,
  galerie,
  settings,
} from "./schema";
import { hash } from "bcryptjs";

async function seed() {
  console.log("🌱 Démarrage du seeding de la base de données...");

  // 1. Admin
  console.log("👤 Insertion de l'administrateur...");
  const hashedPassword = await hash("Macof2024!", 10);
  await db
    .insert(administrateurs)
    .values({
      nom: "Admin MACOF",
      email: "admin@macof-holding.com",
      password_hash: hashedPassword,
      role: "admin",
    })
    .onConflictDoNothing();

  // 2. Settings (Contact Info)
  console.log("⚙️ Insertion des paramètres globaux (settings)...");
  await db
    .insert(settings)
    .values([
      { key: "site_title", value: "MACOF Holding" },
      { key: "contact_email", value: "macofholding2018@gmail.com" },
      { key: "contact_phone", value: "+224 625 74 46 26 / +224 623 98 75 11" },
      {
        key: "contact_address",
        value: "Manquepa en face de banc bleu / Kaloum / République de Guinée",
      },
    ])
    .onConflictDoNothing();

  // 3. Filiales
  console.log("🏢 Insertion des filiales...");
  const FILIALES = [
    {
      nom: "MACOF Immobilier SARL",
      slug: "immobilier",
      secteur: "Immobilier & BTP",
      description:
        "Filiale spécialisée dans l'investissement immobilier, la promotion et les travaux publics (BTP). Elle intervient dans la conception, la réalisation et la gestion de projets immobiliers et d'infrastructures structurants.",
      image_url:
        "https://images.unsplash.com/photo-1541888086225-f1262d0577d2?q=80&w=1000&auto=format&fit=crop",
      statut: "actif",
    },
    {
      nom: "SEBA INTERNATIONAL",
      slug: "restauration",
      secteur: "Restauration & Traiteur",
      description:
        "Restauration, Boulangerie, Pâtisserie, Traiteur et Événementiel. Un établissement haut de gamme alliant excellence culinaire, rigueur organisationnelle et standards élevés de qualité.",
      image_url:
        "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop",
      statut: "actif",
    },
    {
      nom: "MACOF Print & Com SARL",
      slug: "print",
      secteur: "Communication & Impression",
      description:
        "Filiale spécialisée dans l'imprimerie professionnelle, la communication visuelle et l'organisation de grands événements.",
      image_url:
        "https://images.unsplash.com/photo-1598520106830-8c45c2035460?q=80&w=1000&auto=format&fit=crop",
      statut: "actif",
    },
    {
      nom: "MACOF Mining SARL",
      slug: "mining",
      secteur: "Activités minières",
      description:
        "Filiale spécialisée dans les activités minières et la valorisation des ressources naturelles (exploration, exploitation, sous-traitance).",
      image_url:
        "https://image.pollinations.ai/prompt/mining%20quarry%20industrial%20heavy%20machinery?width=2000&height=1200&nologo=true",
      statut: "actif",
    },
    {
      nom: "MACOF Transit SARL",
      slug: "transit",
      secteur: "Transit, Logistique & Voyages",
      description:
        "Filiale spécialisée dans le transit, la logistique, le transport de marchandises et les services de voyage.",
      image_url:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
      statut: "actif",
    },
    {
      nom: "MACOF Fishing SARL",
      slug: "fishing",
      secteur: "Pêche & Ressources maritimes",
      description:
        "Filiale spécialisée dans les activités halieutiques et la valorisation des ressources maritimes.",
      image_url:
        "https://image.pollinations.ai/prompt/large%20industrial%20fishing%20vessel%20in%20ocean%20nets?width=2000&height=1200&nologo=true",
      statut: "actif",
    },
  ];

  await db.delete(galerie);
  await db.delete(filiales);

  for (const f of FILIALES) {
    await db
      .insert(filiales)
      .values(f as any)
      .onConflictDoUpdate({
        target: filiales.slug,
        set: {
          nom: f.nom,
          secteur: f.secteur,
          description: f.description,
          image_url: f.image_url,
          statut: f.statut as any,
        },
      });
  }

  // 4. Page Contents
  console.log("📄 Insertion des contenus de pages (page_contents)...");

  const pagesData = [
    // HOME PAGE
    {
      page_slug: "home",
      section_key: "hero_title_small",
      content_value: "MACOF HOLDING",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "hero_title_main",
      content_value:
        "L'art de façonner <br/><span class=\"italic text-red-500 font-light\">l'avenir.</span>",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "hero_desc",
      content_value:
        "Groupe guinéen structuré autour d'une vision ambitieuse : construire, développer et transformer durablement des secteurs stratégiques de l'économie.",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "hero_bg",
      content_value:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "vision_title_small",
      content_value: "PRÉSENTATION GÉNÉRALE",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "vision_desc_1",
      content_value:
        "MACOF Holding incarne l'art de façonner l'avenir, en créant de la valeur durable pour ses partenaires, ses collaborateurs et la nation.",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "vision_desc_2",
      content_value:
        "Notre mission : Structurer, piloter et développer nos filiales à travers une gouvernance rigoureuse, une stratégie claire et une gestion centralisée, afin de garantir une croissance durable et créatrice de valeur.",
      content_type: "text",
    },
    {
      page_slug: "home",
      section_key: "realisations",
      content_value: JSON.stringify([
        {
          title: "Projets Résidentiels",
          category: "Immobilier",
          image:
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop",
        },
        {
          title: "Gastronomie Premium",
          category: "Restauration",
          image:
            "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop",
        },
        {
          title: "Exploitation Minière",
          category: "Mining",
          image:
            "https://image.pollinations.ai/prompt/mining%20quarry%20industrial%20heavy%20machinery?width=2000&height=1200&nologo=true",
        },
        {
          title: "Communication Visuelle",
          category: "Print & Com",
          image:
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop",
        },
        {
          title: "Transport Fret",
          category: "Transit",
          image:
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
        },
        {
          title: "Ressources Marines",
          category: "Fishing",
          image:
            "https://image.pollinations.ai/prompt/large%20industrial%20fishing%20vessel%20in%20ocean%20nets?width=2000&height=1200&nologo=true",
        },
      ]),
      content_type: "json",
    },
    {
      page_slug: "home",
      section_key: "actualites",
      content_value: JSON.stringify([
        {
          date: "Octobre 2026",
          category: "Institutionnel",
          title:
            "MACOF Holding réaffirme sa position de leader dans l'économie guinéenne",
          image:
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
        },
        {
          date: "Septembre 2026",
          category: "Immobilier",
          title: "Lancement de nouveaux projets d'infrastructures structurants",
          image:
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop",
        },
        {
          date: "Août 2026",
          category: "Restauration",
          title:
            "SEBA International étend ses services de restauration collective",
          image:
            "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=600&auto=format&fit=crop",
        },
      ]),
      content_type: "json",
    },

    // ABOUT PAGE
    {
      page_slug: "about",
      section_key: "hero_title",
      content_value: 'MACOF <span class="italic text-[#b8142b]">Holding</span>',
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "hero_desc",
      content_value:
        "MACOF Holding est un groupe de droit guinéen structuré autour d'une vision ambitieuse : construire, développer et transformer durablement des secteurs stratégiques de l'économie. À travers une organisation moderne et une gouvernance rigoureuse, le groupe incarne « l'art de façonner l'avenir » en créant de la valeur durable pour ses partenaires, ses collaborateurs et la nation.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "hero_img",
      content_value:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "vision_text",
      content_value:
        "Devenir un groupe de référence, reconnu pour son excellence, sa performance durable et sa contribution au développement économique de la Guinée et au-delà de la sous-région ouest-africaine.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "mission_text",
      content_value:
        "Structurer, piloter et développer ses filiales à travers une gouvernance rigoureuse, une stratégie claire et une gestion centralisée, afin de garantir une croissance durable et créatrice de valeur pour l'ensemble des parties prenantes — actionnaires, collaborateurs, partenaires, clients et la collectivité nationale.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "valeurs_text",
      content_value:
        "Excellence - Viser l'excellence dans tout ce que nous entreprenons\nInnovation - Innover en permanence pour rester à la pointe\nIntégrité - Opérer avec transparence et respect de nos engagements\nEngagement - S'engager envers nos clients, partenaires et communauté\nResponsabilité - Contribuer au développement durable\nEsprit d'équipe - Travailler ensemble pour atteindre l'excellence collective",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "historique_2018",
      content_value:
        "Fondation de MACOF SARL sous la forme d'une Société à Responsabilité Limitée (SARL) en République de Guinée, marquant le point de départ des activités du groupe.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "historique_2023",
      content_value:
        "Évolution vers une Société Anonyme (SA), traduisant une phase d'expansion et de structuration renforcée, avec une gouvernance formelle et une capacité d'investissement élargie.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "historique_2026",
      content_value:
        "Adoption d'un modèle de Holding afin d'optimiser la gouvernance, la coordination stratégique et le développement sectoriel du groupe, dans une logique de spécialisation par filiale.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "org_text_1",
      content_value:
        "MACOF Holding développe ses activités à travers six filiales expertes dans leurs domaines respectifs, chacune dédiée à un secteur stratégique de l'économie guinéenne : Immobilier & BTP, Restauration & Traiteur, Communication & Impression, Activités minières, Transit & Logistique, et Pêche & Ressources halieutiques.",
      content_type: "text",
    },
    {
      page_slug: "about",
      section_key: "org_text_2",
      content_value:
        "La structure holding permet une coordination stratégique efficace tout en offrant à chaque filiale l'autonomie nécessaire pour exceller dans son domaine d'expertise spécifique.",
      content_type: "text",
    },

    // IMMOBILIER
    {
      page_slug: "immobilier",
      section_key: "hero_title",
      content_value: "MACOF Immobilier SARL",
      content_type: "text",
    },
    {
      page_slug: "immobilier",
      section_key: "hero_desc",
      content_value:
        "Filiale spécialisée dans l'investissement immobilier, la promotion et les travaux publics (BTP).",
      content_type: "text",
    },
    {
      page_slug: "immobilier",
      section_key: "hero_bg",
      content_value:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "immobilier",
      section_key: "content_title",
      content_value: "Conception, Réalisation & Infrastructures",
      content_type: "text",
    },
    {
      page_slug: "immobilier",
      section_key: "content_body",
      content_value:
        "MACOF Immobilier SARL intervient dans la conception, la réalisation et la gestion de projets immobiliers et d'infrastructures structurants. Grâce à une organisation rigoureuse et à une expertise technique adaptée aux exigences du secteur, la filiale contribue activement au développement urbain et à la modernisation des infrastructures.",
      content_type: "text",
    },
    {
      page_slug: "immobilier",
      section_key: "services",
      content_value: JSON.stringify([
        "L'acquisition et la valorisation de terrains",
        "La conception et la construction de bâtiments résidentiels, commerciaux et administratifs",
        "La promotion et la commercialisation de biens immobiliers",
        "La gestion locative et patrimoniale",
        "Les travaux publics et ouvrages d'infrastructures",
        "Les travaux de réhabilitation, d'aménagement et de modernisation urbaine",
      ]),
      content_type: "json",
    },

    // RESTAURATION
    {
      page_slug: "restauration",
      section_key: "hero_title",
      content_value: "SEBA INTERNATIONAL",
      content_type: "text",
    },
    {
      page_slug: "restauration",
      section_key: "hero_desc",
      content_value:
        "Restauration, Boulangerie, Pâtisserie, Traiteur, Événementiel",
      content_type: "text",
    },
    {
      page_slug: "restauration",
      section_key: "hero_bg",
      content_value:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "restauration",
      section_key: "content_title",
      content_value: "Excellence culinaire & Qualité",
      content_type: "text",
    },
    {
      page_slug: "restauration",
      section_key: "content_body",
      content_value:
        "Un établissement haut de gamme alliant excellence culinaire, rigueur organisationnelle et standards élevés de qualité, structuré autour de deux pôles d'activités principaux : Le Pôle Boulangerie (fabrication quotidienne sur place, fraîcheur, saveur authentique) et Le Pôle Restauration (commerciale premium, collective structurée, événementielle et traiteur).",
      content_type: "text",
    },
    {
      page_slug: "restauration",
      section_key: "services",
      content_value: JSON.stringify([
        "Restauration commerciale premium : Expérience culinaire soignée",
        "Restauration collective structurée : Cantines d'entreprises et bases minières",
        "Restauration événementielle & traiteur : Mariages, conférences, cocktails",
        "Boulangerie & Pâtisserie : Fabrication artisanale quotidienne",
        "Fast-Foods & Pizzeria : Saveurs du monde et plats rapides",
        "Plats de résistance & Spécialités Africaines",
      ]),
      content_type: "json",
    },

    // PRINT
    {
      page_slug: "print",
      section_key: "hero_title",
      content_value: "MACOF Print & Com SARL",
      content_type: "text",
    },
    {
      page_slug: "print",
      section_key: "hero_desc",
      content_value:
        "Imprimerie professionnelle, communication visuelle et événementiel",
      content_type: "text",
    },
    {
      page_slug: "print",
      section_key: "hero_bg",
      content_value:
        "https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=2000&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "print",
      section_key: "content_title",
      content_value: "Valorisation de votre image",
      content_type: "text",
    },
    {
      page_slug: "print",
      section_key: "content_body",
      content_value:
        "Elle accompagne entreprises, institutions et organisations dans la conception et la valorisation de leur image. La filiale se distingue particulièrement par son expertise dans l'organisation et la gestion de grands événements, incluant le montage technique, la coordination logistique et l'accompagnement stratégique de manifestations.",
      content_type: "text",
    },
    {
      page_slug: "print",
      section_key: "services",
      content_value: JSON.stringify([
        "Création d'identités visuelles et de supports institutionnels",
        "Impression numérique et offset de haute qualité",
        "Production de supports publicitaires et signalétiques",
        "Montage technique et coordination logistique d'événements",
        "Accompagnement stratégique de manifestations publiques",
      ]),
      content_type: "json",
    },

    // MINING
    {
      page_slug: "mining",
      section_key: "hero_title",
      content_value: "MACOF Mining SARL",
      content_type: "text",
    },
    {
      page_slug: "mining",
      section_key: "hero_desc",
      content_value:
        "Activités minières et valorisation des ressources naturelles",
      content_type: "text",
    },
    {
      page_slug: "mining",
      section_key: "hero_bg",
      content_value:
        "https://image.pollinations.ai/prompt/mining%20quarry%20industrial%20heavy%20machinery?width=2000&height=1200&nologo=true",
      content_type: "text",
    },
    {
      page_slug: "mining",
      section_key: "content_title",
      content_value: "Exploitation responsable et durable",
      content_type: "text",
    },
    {
      page_slug: "mining",
      section_key: "content_body",
      content_value:
        "MACOF Mining SARL évolue dans le respect des normes réglementaires et environnementales, avec pour objectif de contribuer au développement durable et structuré du secteur minier guinéen.",
      content_type: "text",
    },
    {
      page_slug: "mining",
      section_key: "services",
      content_value: JSON.stringify([
        "Exploration et exploitation minière",
        "Sous-traitance et appui aux opérations minières",
        "Transport et commercialisation de produits miniers",
        "Respect rigoureux des normes environnementales",
        "Soutien au développement communautaire",
      ]),
      content_type: "json",
    },

    // TRANSIT
    {
      page_slug: "transit",
      section_key: "hero_title",
      content_value: "MACOF Transit SARL",
      content_type: "text",
    },
    {
      page_slug: "transit",
      section_key: "hero_desc",
      content_value:
        "Transit, logistique, transport de marchandises et services de voyage",
      content_type: "text",
    },
    {
      page_slug: "transit",
      section_key: "hero_bg",
      content_value:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2000&auto=format&fit=crop",
      content_type: "text",
    },
    {
      page_slug: "transit",
      section_key: "content_title",
      content_value: "Fiabilité, conformité et efficacité",
      content_type: "text",
    },
    {
      page_slug: "transit",
      section_key: "content_body",
      content_value:
        "Grâce à une organisation structurée et à une parfaite maîtrise des procédures réglementaires, MACOF Transit SARL facilite les échanges commerciaux et les déplacements internationaux, en garantissant fiabilité, conformité et efficacité.",
      content_type: "text",
    },
    {
      page_slug: "transit",
      section_key: "services",
      content_value: JSON.stringify([
        "Le dédouanement et les formalités administratives",
        "Le transport national et international",
        "La gestion logistique et le suivi des expéditions",
        "L'assistance aux opérations d'import-export",
        "La vente de billets d'avion et l'accompagnement aux voyages",
      ]),
      content_type: "json",
    },

    // FISHING
    {
      page_slug: "fishing",
      section_key: "hero_title",
      content_value: "MACOF Fishing SARL",
      content_type: "text",
    },
    {
      page_slug: "fishing",
      section_key: "hero_desc",
      content_value:
        "Activités halieutiques et valorisation des ressources maritimes",
      content_type: "text",
    },
    {
      page_slug: "fishing",
      section_key: "hero_bg",
      content_value:
        "https://image.pollinations.ai/prompt/large%20industrial%20fishing%20vessel%20in%20ocean%20nets?width=2000&height=1200&nologo=true",
      content_type: "text",
    },
    {
      page_slug: "fishing",
      section_key: "content_title",
      content_value: "Gestion responsable des ressources",
      content_type: "text",
    },
    {
      page_slug: "fishing",
      section_key: "content_body",
      content_value:
        "MACOF Fishing SARL contribue au développement du secteur de la pêche en garantissant qualité, respect des normes et gestion responsable des ressources maritimes de la Guinée.",
      content_type: "text",
    },
    {
      page_slug: "fishing",
      section_key: "services",
      content_value: JSON.stringify([
        "La pêche artisanale et industrielle",
        "La transformation et la conservation des produits halieutiques",
        "La commercialisation et la distribution des produits de la mer",
        "Activités liées à l'exploitation durable des ressources marines",
        "Contrôle qualité et respect des normes sanitaires",
      ]),
      content_type: "json",
    },
  ];

  await db.delete(page_contents); // Nettoyage de la table

  for (const page of pagesData) {
    await db
      .insert(page_contents)
      .values({
        page_slug: page.page_slug,
        section_key: page.section_key,
        content_value: page.content_value,
        content_type: page.content_type,
      })
      .onConflictDoUpdate({
        target: [page_contents.page_slug, page_contents.section_key],
        set: {
          content_value: page.content_value,
          content_type: page.content_type,
        },
      });
  }

  console.log("🎉 Seeding terminé avec succès !");
}

seed()
  .catch((error) => {
    console.error("❌ Erreur lors du seeding :", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
