import { db } from "./src/db/client";
import { galerie } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Updating galerie items 1-4...");
  
  await db.update(galerie).set({
    image_url: "https://media.istockphoto.com/id/1572513989/photo/african-couple-viewing-real-estate-house.jpg?s=612x612&w=0&k=20",
    titre: "Développement Foncier",
    description: "Projet résidentiel d'envergure, standing international."
  }).where(eq(galerie.id, 1));

  await db.update(galerie).set({
    image_url: "https://media.istockphoto.com/id/522336505/photo/happy-couple-at-homeware-store.webp?a=1&b=1&s=612x612&w=0&k=20&c=5ZKkTJadks8bitjWzlWKDrddNESsdzsleXUFgoLCBvU=",
    titre: "Design & Aménagement",
    description: "Création d'espaces de vie modernes et confortables."
  }).where(eq(galerie.id, 2));

  await db.update(galerie).set({
    image_url: "https://media.istockphoto.com/id/1358799929/photo/young-couple-consulting-with-interior-designer.webp?a=1&b=1&s=612x612&w=0&k=20&c=4P02nWGGQP1xuJ3MF-jpuxHmSjSv875178bXyTfvQnM=",
    titre: "Architecture d'Intérieur",
    description: "Consultation et accompagnement sur-mesure."
  }).where(eq(galerie.id, 3));

  await db.update(galerie).set({
    image_url: "https://media.istockphoto.com/id/1572514012/photo/african-couple-viewing-real-estate-house.webp?a=1&b=1&s=612x612&w=0&k=20&c=_D-nrY18IaQCjce0jJGeONSqbuQ-6iCQM8X4qlnxw0g=",
    titre: "Gestion de Biens",
    type_projet: "Immobilier",
    description: "Visites et accompagnement pour vos acquisitions."
  }).where(eq(galerie.id, 4));

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
