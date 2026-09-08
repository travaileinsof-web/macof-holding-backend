// src/services/chatbotTools.service.ts

export const mettreAJourPrixDeclaration = {
  name: "mettre_a_jour_prix_produit",
  description: "Modifie le prix en GNF d'un produit du menu.",
  parameters: {
    type: "OBJECT",
    properties: {
      nom_produit: {
        type: "STRING",
        description: "Nom du produit (ex: Pain, Pizza).",
      },
      nouveau_prix_gnf: { type: "NUMBER", description: "Nouveau prix en GNF." },
    },
    required: ["nom_produit", "nouveau_prix_gnf"],
  },
};

export const changerDisponibiliteDeclaration = {
  name: "changer_disponibilite_produit",
  description: "Rend un produit disponible ou indisponible au menu.",
  parameters: {
    type: "OBJECT",
    properties: {
      nom_produit: { type: "STRING", description: "Nom du produit." },
      disponible: {
        type: "BOOLEAN",
        description: "true pour disponible, false pour rupture.",
      },
    },
    required: ["nom_produit", "disponible"],
  },
};

export const modifierStatutCommandeDeclaration = {
  name: "modifier_statut_commande",
  description: "Met à jour le statut d'une commande par sa référence.",
  parameters: {
    type: "OBJECT",
    properties: {
      reference_commande: {
        type: "STRING",
        description: "Référence (ex: SEBA-1234).",
      },
      statut: {
        type: "STRING",
        enum: [
          "en_attente",
          "confirmee",
          "en_preparation",
          "en_livraison",
          "livree",
          "annulee",
        ],
        description: "Nouveau statut de la commande.",
      },
    },
    required: ["reference_commande", "statut"],
  },
};

export const modifierStatutDemandeDeclaration = {
  name: "modifier_statut_demande_contact",
  description: "Change le statut d'une demande de contact client.",
  parameters: {
    type: "OBJECT",
    properties: {
      reference_demande: {
        type: "STRING",
        description: "Référence de la demande.",
      },
      statut: {
        type: "STRING",
        enum: ["nouveau", "en_cours", "traite", "archive"],
        description: "Nouveau statut.",
      },
    },
    required: ["reference_demande", "statut"],
  },
};

export const modifierStatutFilialeDeclaration = {
  name: "modifier_statut_filiale",
  description: "Active ou désactive une filiale.",
  parameters: {
    type: "OBJECT",
    properties: {
      nom_filiale: { type: "STRING", description: "Nom de la filiale." },
      statut: {
        type: "STRING",
        enum: ["actif", "inactif"],
        description: "Statut.",
      },
    },
    required: ["nom_filiale", "statut"],
  },
};

export const chatbotTools = [
  {
    functionDeclarations: [
      mettreAJourPrixDeclaration,
      changerDisponibiliteDeclaration,
      modifierStatutCommandeDeclaration,
      modifierStatutDemandeDeclaration,
      modifierStatutFilialeDeclaration,
    ],
  },
];
