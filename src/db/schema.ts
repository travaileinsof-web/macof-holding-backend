import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const adminRoleEnum = pgEnum("admin_role", ["admin", "gestionnaire"]);

export const statutDemandeEnum = pgEnum("statut_demande", [
  "nouveau",
  "en_cours",
  "traite",
  "archive",
]);

export const typeDemandeEnum = pgEnum("type_demande", [
  "information",
  "devis",
  "partenariat",
  "reclamation",
  "autre",
]);

export const typeDocumentEnum = pgEnum("type_document", [
  "catalogue",
  "brochure",
  "plaquette",
  "fiche_technique",
  "autre",
]);

export const typeProjetEnum = pgEnum("type_projet", [
  "residentiel",
  "commercial",
  "infrastructure",
  "evenement",
  "production",
  "logistique",
  "autre",
]);

export const statutFilialeEnum = pgEnum("statut_filiale", ["actif", "inactif"]);

export const statutResolutionEnum = pgEnum("statut_resolution", [
  "resolu",
  "non_resolu",
  "en_attente",
]);

export const civiliteEnum = pgEnum("civilite", ["monsieur", "madame"]);

// ─── Filiales ────────────────────────────────────────────────────────────────

export const filiales = pgTable("filiales", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  secteur: varchar("secteur", { length: 255 }).notNull(),
  image_url: text("image_url"),
  details_json: jsonb("details_json"),
  email: varchar("email", { length: 255 }),
  telephone: varchar("telephone", { length: 50 }),
  adresse: text("adresse"),
  site_web: varchar("site_web", { length: 500 }),
  statut: statutFilialeEnum("statut").default("actif").notNull(),
  archived: boolean("archived").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Administrateurs ─────────────────────────────────────────────────────────

export const administrateurs = pgTable("administrateurs", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  filiale_attribuee: integer("filiale_attribuee").references(() => filiales.id), // ✅ Ajout de la contrainte FK
  archived: boolean("archived").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Demandes de contact ────────────────────────────────────────────────────

export const demandes_contact = pgTable(
  "demandes_contact",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 50 }).notNull().unique(),
    filiale: integer("filiale").references(() => filiales.id),
    type_demande: typeDemandeEnum("type_demande")
      .default("information")
      .notNull(),
    civilite: civiliteEnum("civilite"),
    nom_complet: varchar("nom_complet", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    telephone: varchar("telephone", { length: 50 }),
    societe: varchar("societe", { length: 255 }),
    fonction: varchar("fonction", { length: 255 }),
    objet: varchar("objet", { length: 500 }),
    message: text("message").notNull(),
    details_json: jsonb("details_json"),
    piece_jointe_path: text("piece_jointe_path"),
    statut: statutDemandeEnum("statut").default("nouveau").notNull(),
    notes_internes: text("notes_internes"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archived: boolean("archived").default(false).notNull(),
  },
  (self) => [
    index("idx_demandes_filiale").on(self.filiale),
    index("idx_demandes_statut").on(self.statut),
    index("idx_demandes_created").on(self.created_at),
  ],
);

// ─── Catalogues ───────────────────────────────────────────────────────────────

export const catalogues = pgTable(
  "catalogues",
  {
    id: serial("id").primaryKey(),
    titre: varchar("titre", { length: 255 }).notNull(),
    filiale: integer("filiale").references(() => filiales.id),
    type_document: typeDocumentEnum("type_document")
      .default("catalogue")
      .notNull(),
    file_path: text("file_path").notNull(),
    taille_ko: integer("taille_ko"),
    format: varchar("format", { length: 20 }).notNull(),
    telechargements: integer("telechargements").default(0).notNull(),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (self) => [index("idx_catalogues_filiale").on(self.filiale)],
);

// ─── Galerie ─────────────────────────────────────────────────────────────────

export const galerie = pgTable(
  "galerie",
  {
    id: serial("id").primaryKey(),
    titre: varchar("titre", { length: 255 }).notNull(),
    filiale: integer("filiale").references(() => filiales.id),
    type_projet: typeProjetEnum("type_projet"),
    lieu: varchar("lieu", { length: 255 }),
    date_realisation: varchar("date_realisation", { length: 50 }),
    description_courte: text("description_courte"),
    image_path: text("image_path").notNull(),
    archived: boolean("archived").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (self) => [index("idx_galerie_filiale").on(self.filiale)],
);

// ─── Chatbot logs ───────────────────────────────────────────────────────────

export const chatbot_logs = pgTable(
  "chatbot_logs",
  {
    id: serial("id").primaryKey(),
    session_id: varchar("session_id", { length: 255 }).notNull(),
    intention_detectee: varchar("intention_detectee", { length: 255 }),
    filiale_orientee: integer("filiale_orientee").references(() => filiales.id),
    conversation_json: jsonb("conversation_json"),
    statut_resolution: statutResolutionEnum("statut_resolution")
      .default("en_attente")
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (self) => [index("idx_chatbot_session").on(self.session_id)],
);

// ─── Page contents (CMS) ────────────────────────────────────────────────────

export const page_contents = pgTable(
  "page_contents",
  {
    id: serial("id").primaryKey(),
    page_slug: varchar("page_slug", { length: 255 }).notNull(),
    section_key: varchar("section_key", { length: 255 }).notNull(),
    content_value: text("content_value"),
    content_type: varchar("content_type", { length: 50 })
      .default("text")
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (self) => [
    uniqueIndex("idx_page_slug_section").on(self.page_slug, self.section_key),
  ],
);

// ─── Settings ───────────────────────────────────────────────────────────────

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Drizzle ORM Relations ───────────a───────────────────────────────────────

export const filialesRelations = relations(filiales, ({ many }) => ({
  demandes: many(demandes_contact),
  catalogues: many(catalogues),
  galerieItems: many(galerie),
  administrateurs: many(administrateurs),
  chatbotLogs: many(chatbot_logs),
}));

export const demandesContactRelations = relations(
  demandes_contact,
  ({ one }) => ({
    filialeData: one(filiales, {
      fields: [demandes_contact.filiale],
      references: [filiales.id],
    }),
  }),
);

export const administrateursRelations = relations(
  administrateurs,
  ({ one }) => ({
    filiale: one(filiales, {
      fields: [administrateurs.filiale_attribuee],
      references: [filiales.id],
    }),
  }),
);

export const cataloguesRelations = relations(catalogues, ({ one }) => ({
  filialeData: one(filiales, {
    fields: [catalogues.filiale],
    references: [filiales.id],
  }),
}));

export const galerieRelations = relations(galerie, ({ one }) => ({
  filialeData: one(filiales, {
    fields: [galerie.filiale],
    references: [filiales.id],
  }),
}));

// ─── Type exports for convenience ───────────────────────────────────────────

export type Filiale = typeof filiales.$inferSelect;
export type NewFiliale = typeof filiales.$inferInsert;
export type Administrateur = typeof administrateurs.$inferSelect;
export type NewAdministrateur = typeof administrateurs.$inferInsert;
export type DemandeContact = typeof demandes_contact.$inferSelect;
export type NewDemandeContact = typeof demandes_contact.$inferInsert;
export type Catalogue = typeof catalogues.$inferSelect;
export type NewCatalogue = typeof catalogues.$inferInsert;
export type GalerieItem = typeof galerie.$inferSelect;
export type NewGalerieItem = typeof galerie.$inferInsert;
export type ChatbotLog = typeof chatbot_logs.$inferSelect;
export type NewChatbotLog = typeof chatbot_logs.$inferInsert;
export type PageContent = typeof page_contents.$inferSelect;
export type NewPageContent = typeof page_contents.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
