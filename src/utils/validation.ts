import { z } from 'zod';

// ─── Login ──────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Demande de contact ─────────────────────────────────────────────────────

export const demandeSchema = z.object({
  civilite: z.enum(['monsieur', 'madame']).optional(),
  nom_complet: z.string().min(2, 'Le nom complet est requis (min 2 caracteres)'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional().default(''),
  societe: z.string().optional().default(''),
  fonction: z.string().optional().default(''),
  filiale: z.union([z.string().min(1, 'La filiale est requise'), z.number().int().positive()]).optional().default(''),
  type_demande: z.enum(['information', 'devis', 'partenariat', 'reclamation', 'autre']).optional().default('information'),
  objet: z.string().optional().default(''),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caracteres'),
  details_json: z.record(z.string(), z.unknown()).optional().default({}),
});

export type DemandeInput = z.infer<typeof demandeSchema>;

// ─── Catalogue ─────────────────────────────────────────────────────────────

export const catalogueSchema = z.object({
  titre: z.string().min(2, 'Le titre est requis (min 2 caracteres)'),
  filiale: z.union([z.string().min(1), z.number().int().positive()]).optional(),
  type_document: z.enum(['catalogue', 'brochure', 'plaquette', 'fiche_technique', 'autre']).optional().default('catalogue'),
  file_path: z.string().min(1, 'Le chemin du fichier est requis'),
  taille_ko: z.number().int().positive().optional(),
  format: z.string().min(1, 'Le format est requis'),
});

export type CatalogueInput = z.infer<typeof catalogueSchema>;

// ─── Galerie ─────────────────────────────────────────────────────────────────

export const galerieSchema = z.object({
  titre: z.string().min(2, 'Le titre est requis (min 2 caracteres)'),
  filiale: z.union([z.string().min(1), z.number().int().positive()]).optional(),
  type_projet: z.enum(['residentiel', 'commercial', 'infrastructure', 'evenement', 'production', 'logistique', 'autre']).optional(),
  lieu: z.string().optional().default(''),
  date_realisation: z.string().optional().default(''),
  description_courte: z.string().optional().default(''),
  image_path: z.string().min(1, 'Le chemin de l\'image est requis'),
});

export type GalerieInput = z.infer<typeof galerieSchema>;

// ─── Filiale ────────────────────────────────────────────────────────────────

export const filialeSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis (min 2 caracteres)'),
  slug: z.string().min(2, 'Le slug est requis').regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des minuscules, chiffres et tirets'),
  description: z.string().optional().default(''),
  secteur: z.string().min(1, 'Le secteur est requis'),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')).default(''),
  details_json: z.record(z.string(), z.unknown()).optional().default({}),
  email: z.string().email('Email invalide').optional().or(z.literal('')).default(''),
  telephone: z.string().optional().default(''),
  adresse: z.string().optional().default(''),
  site_web: z.string().url('URL invalide').optional().or(z.literal('')).default(''),
  statut: z.enum(['actif', 'inactif']).optional().default('actif'),
  archived: z.boolean().optional().default(false),
});

export type FilialeInput = z.infer<typeof filialeSchema>;

// ─── Settings ──────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  key: z.string().min(1, 'La cle est requise'),
  value: z.string().optional().default(''),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = z.object({
  value: z.string(),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

// ─── Page content ──────────────────────────────────────────────────────────

export const pageContentSchema = z.object({
  page_slug: z.string().min(1, 'Le slug de page est requis'),
  section_key: z.string().min(1, 'La cle de section est requise'),
  content_value: z.string().optional().default(''),
  content_type: z.enum(['text', 'html', 'markdown', 'json']).optional().default('text'),
});

export type PageContentInput = z.infer<typeof pageContentSchema>;

export const pageContentUpdateSchema = z.object({
  content_value: z.string(),
  content_type: z.enum(['text', 'html', 'markdown', 'json']).optional(),
});

export type PageContentUpdateInput = z.infer<typeof pageContentUpdateSchema>;

// ─── Admin update ────────────────────────────────────────────────────────

export const adminUpdateSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis').optional(),
  email: z.string().email('Email invalide').optional(),
  role: z.enum(['admin', 'gestionnaire']).optional(),
  filiale_attribuee: z.number().int().positive().nullable().optional(),
  archived: z.boolean().optional(),
});

export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;

// ─── Change password ──────────────────────────────────────────────────────

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caracteres'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Chatbot log ────────────────────────────────────────────────────────────

export const chatbotLogSchema = z.object({
  session_id: z.string().min(1, 'L\'identifiant de session est requis'),
  intention_detectee: z.string().optional().default(''),
  filiale_orientee: z.number().int().positive().optional(),
  conversation_json: z.record(z.string(), z.unknown()).optional().default({}),
  statut_resolution: z.enum(['resolu', 'non_resolu', 'en_attente']).optional().default('en_attente'),
});

export type ChatbotLogInput = z.infer<typeof chatbotLogSchema>;
