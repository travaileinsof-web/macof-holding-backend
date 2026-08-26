import { db } from './client';
import { produits_menu } from './schema';

const images = {
  plats: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop',
  boulangerie: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop',
  boissons: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1000&auto=format&fit=crop',
};

const plats = [
  ['Chawarma poulet', 30000], ['Chawarma viande', 35000], ['Chawarma Seba', 40000], ['Fataya simple', 25000], ['Fataya royal', 40000], ['Big Fataya', 50000], ['Tacos viande et poulet', 50000], ['Sandwich viande', 40000], ['Sandwich poulet', 35000],
  ['Poulet Seba', 80000], ['Demi-poulet grillé', 70000], ['Poulet entier', 130000], ['Pilon pané', 60000], ['Brochette de poulet', 70000], ['Brochette viande', 80000], ['Brochette lotte', 70000], ['Pêche du jour grillée', 100000], ['Filet de capitaine grillé', 120000], ['Fruits de mer asiatiques', 120000],
  ['Nouilles Seba', 60000], ['Spaghetti bolognaise', 70000], ['Linguine aux fruits de mer', 80000], ['Penne Alfredo', 80000], ['Penne Arrabiata', 70000], ['Tagliatelles au jambon', 100000], ['Tagliatelles fruits de mer', 100000], ['Soupe de poisson', 70000], ['Soupe de viande', 90000],
  ['Pizza 4 Fromages', 120000], ['Pizza Végétarienne', 100000], ['Pizza aux Fruits de Mer', 130000], ['Pizza PM', 60000], ['Pizza Moyenne', 100000], ['Pizza GM', 170000], ['Classic Burger', 50000], ['Chicken Burger', 60000], ['Double Cheese Burger', 70000], ['Royal Burger', 70000],
  ['Formule Midi', 70000], ['Attiéké Poisson', 100000], ['Fruits de mer du samedi', 400000], ['Salade verte / Seba', 60000], ['Salade de chef', 70000], ['Salade niçoise', 80000], ['Salade césar', 120000],
  ['Œuf au plat', 30000], ['Omelette nature', 40000], ['Omelette légumes', 40000], ['Omelette jambon', 50000], ['Panini poulet / Club sandwich', 30000], ['Panini viande / Panini thon', 40000], ['Mix ail poulet au BBQ', 40000], ['Crêpe nature', 25000], ['Crêpe Nutella', 40000],
  ['Mini Tartes / Beignet nature', 10000], ['Mini Cake', 10000], ['Beignet à la crème', 15000], ['Pastel viande ou poulet (3 pièces)', 20000], ['Sablés (portion)', 20000], ['Flan (la part)', 25000], ['Moka vanille', 25000], ['Moka Choco-fraise-café', 35000], ['Quiche lorraine / Friand poulet', 30000], ['Feuilleté saucisse / Fataya poulet', 35000], ['Fataya viande / Friand viande', 40000], ['Cake moyen', 60000], ['Cake GM', 100000], ['Gâteau événementiel', 250000],
];
const boulangerie = [['Croissant', 10000], ['Pain au lait', 5000], ['Pain chocolat', 12500], ['Pain aux raisins', 12500], ['Pain brioché', 15000], ['Muffin (1 pièce)', 7000], ['Madeleines', 3000], ['Rocher au coco', 5000], ['Croquettes', 15000], ['Baguette (4 pièces)', 5000]];
const boissons = [['Eau minérale', 5000], ['Coca-Cola / Sprite / Fanta', 15000], ['Beaufort / Guilux / Fax blanc / Perrier', 15000], ['Jus en verre', 15000], ['Vinto / XXL / Fruita los', 20000], ['Guinness / Heineken', 25000], ['Red Bull / Incolac', 30000], ['Jus en brique / Lait (1L)', 50000], ['Chénet', 300000], ['Tequila / Red Label / Jack Daniel’s', 600000], ['Vodka Absolut / Baileys', 600000], ['Chivas Regal / Gentleman', 800000], ['Black Label / Belvedere / Grey Goose / Cîroc', 1000000], ['Veuve Clicquot / Pierre Grande / Moët & Chandon', 1200000], ['Glenfiddich 12 ans', 1500000], ['Glenfiddich 15 ans', 2000000], ['Cocktails classiques', 80000], ['Seba Colada', 90000], ['Supplément verre', 40000]];

const rows = [
  ...plats.map(([nom, prix_gnf]) => ({ nom: String(nom), prix_gnf: Number(prix_gnf), categorie: 'plats' as const, description: 'Préparé par les cuisines SEBA International.', image_url: images.plats })),
  ...boulangerie.map(([nom, prix_gnf]) => ({ nom: String(nom), prix_gnf: Number(prix_gnf), categorie: 'boulangerie' as const, description: 'Préparé frais par la boulangerie SEBA.', image_url: images.boulangerie })),
  ...boissons.map(([nom, prix_gnf]) => ({ nom: String(nom), prix_gnf: Number(prix_gnf), categorie: 'boissons' as const, description: 'Sélection SEBA International.', image_url: images.boissons })),
];

const existing = await db.select({ nom: produits_menu.nom }).from(produits_menu);
const known = new Set(existing.map((item) => item.nom));
const fresh = rows.filter((row) => !known.has(row.nom));
if (fresh.length) await db.insert(produits_menu).values(fresh);
console.log(`${fresh.length} produits SEBA ajoutés (${rows.length - fresh.length} déjà présents).`);
process.exit(0);
