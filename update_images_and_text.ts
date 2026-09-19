import { db } from "./src/db/client";
import {
  page_contents,
  filiales,
  galerie,
  produits_menu,
} from "./src/db/schema";
import { eq } from "drizzle-orm";

const REPLACEMENTS = [
  { from: "1560250097-0b93528c311a", to: "1519085360753-af0119f7cbe7" },
  { from: "1573496359142-b8d87734a5a2", to: "1531123897727-8f129e1bf98c" },
  { from: "1544025162-d76694265947", to: "1583394838336-acd977736f90" },
  { from: "1497366216548-37526070297c", to: "1522071820081-009f0129c71c" },
];

const TEXT_REPLACEMENTS = [
  { from: /MACOF\s+Restauration/gi, to: "SEBA International" },
  { from: /Macof\s+restaurant/gi, to: "SEBA International" },
  { from: /Restaurant\s+MACOF/gi, to: "SEBA International" },
];

function replaceAll(str: string): string {
  if (!str) return str;
  let res = str;
  for (const { from, to } of REPLACEMENTS) res = res.replace(new RegExp(from, "g"), to);
  for (const { from, to } of TEXT_REPLACEMENTS) res = res.replace(from, to);
  return res;
}

async function main() {
  console.log("Updating page_contents...");
  const pages = await db.select().from(page_contents);
  for (const page of pages) {
    const oldContentStr = JSON.stringify(page.content);
    const newContentStr = replaceAll(oldContentStr);
    if (oldContentStr !== newContentStr) {
      await db.update(page_contents).set({ content: JSON.parse(newContentStr), updated_at: new Date() }).where(eq(page_contents.id, page.id));
      console.log(`Updated page_contents for slug: ${page.slug}`);
    }
  }

  console.log("Updating filiales...");
  const fils = await db.select().from(filiales);
  for (const f of fils) {
    let changed = false;
    const update: any = {};
    if (f.nom && f.nom !== replaceAll(f.nom)) { update.nom = replaceAll(f.nom); changed = true; }
    if (f.description && f.description !== replaceAll(f.description)) { update.description = replaceAll(f.description); changed = true; }
    if (f.image_url && f.image_url !== replaceAll(f.image_url)) { update.image_url = replaceAll(f.image_url); changed = true; }
    const oldDetailsStr = JSON.stringify(f.details);
    if (oldDetailsStr && oldDetailsStr !== replaceAll(oldDetailsStr)) { update.details = JSON.parse(replaceAll(oldDetailsStr)); changed = true; }
    if (changed) {
      update.updated_at = new Date();
      await db.update(filiales).set(update).where(eq(filiales.id, f.id));
      console.log(`Updated filiale ID: ${f.id}`);
    }
  }

  console.log("Updating galerie...");
  const gals = await db.select().from(galerie);
  for (const g of gals) {
    let changed = false;
    const update: any = {};
    if (g.titre && g.titre !== replaceAll(g.titre)) { update.titre = replaceAll(g.titre); changed = true; }
    if (g.description && g.description !== replaceAll(g.description)) { update.description = replaceAll(g.description); changed = true; }
    if (g.image_url && g.image_url !== replaceAll(g.image_url)) { update.image_url = replaceAll(g.image_url); changed = true; }
    if (changed) {
      update.updated_at = new Date();
      await db.update(galerie).set(update).where(eq(galerie.id, g.id));
      console.log(`Updated galerie ID: ${g.id}`);
    }
  }

  console.log("Updating produits_menu...");
  const prods = await db.select().from(produits_menu);
  for (const p of prods) {
    let changed = false;
    const update: any = {};
    if (p.nom && p.nom !== replaceAll(p.nom)) { update.nom = replaceAll(p.nom); changed = true; }
    if (p.description && p.description !== replaceAll(p.description)) { update.description = replaceAll(p.description); changed = true; }
    if (p.image_url && p.image_url !== replaceAll(p.image_url)) { update.image_url = replaceAll(p.image_url); changed = true; }
    if (changed) {
      update.updated_at = new Date();
      await db.update(produits_menu).set(update).where(eq(produits_menu.id, p.id));
      console.log(`Updated produit ID: ${p.id}`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
