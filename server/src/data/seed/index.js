import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

function loadJson(filename) {
  const filepath = join(__dirname, filename);
  return JSON.parse(readFileSync(filepath, "utf-8"));
}

async function seedIngredients() {
  console.log("Seeding ingredients...");
  const data = loadJson("ingredients-compounding.json");

  let created = 0;
  let skipped = 0;

  for (const ing of data.ingredients) {
    const existing = await prisma.ingredient.findFirst({
      where: { name: ing.name },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.ingredient.create({
      data: {
        name: ing.name,
        casNumber: ing.cas || null,
        nioshTable: ing.nioshTable,
        nioshDescription: ing.nioshDescription || null,
        reproductiveToxicity: ing.reproductiveToxicity || false,
        ghsCategory: ing.ghsCategory || null,
        physicalForm: ing.physicalForm || "POWDER",
        whmisHazards: ing.whmisHazards || [],
        exposureRoutes: ing.exposureRoutes || {},
        recommendedPPE: ing.recommendedPPE || {},
        ventilationRequired: ing.ventilationRequired || false,
        ventilationType: ing.ventilationType || "GENERAL",
        molecularFormula:
          ing.molecularFormula === "N/A" ? null : ing.molecularFormula || null,
        molecularWeight: ing.molecularWeight || null,
        synonyms: ing.synonyms || [],
        source: ing.source || "SEED",
      },
    });
    created++;
  }

  console.log(
    `  Ingredients: ${created} created, ${skipped} skipped (already exist)`
  );
}

async function seedRegulatoryReferences() {
  console.log("Seeding regulatory references...");
  const data = loadJson("regulatory-references.json");

  const references = [
    {
      source: "OCP",
      title: "Non-Sterile Compounding Risk Assessment Rules",
      version: data.ocp_rules.version,
      effectiveDate: new Date(data.ocp_rules.effectiveDate),
      content: data.ocp_rules,
    },
    {
      source: "NAPRA",
      title: "Model Standards - Complexity Classifications",
      version: data.napra_complexity.version,
      content: data.napra_complexity,
    },
    {
      source: "WHMIS_GHS",
      title: "WHMIS 2015 / GHS Hazard Statements",
      version: data.whmis_ghs.version,
      content: data.whmis_ghs,
    },
    {
      source: "USP",
      title: "USP <795> Non-Sterile Compounding Standards",
      version: data.usp795.version,
      content: data.usp795,
    },
  ];

  let created = 0;

  for (const ref of references) {
    await prisma.regulatoryReference.upsert({
      where: {
        source_title_version: {
          source: ref.source,
          title: ref.title,
          version: ref.version || "latest",
        },
      },
      update: { content: ref.content },
      create: {
        source: ref.source,
        title: ref.title,
        version: ref.version || "latest",
        effectiveDate: ref.effectiveDate || null,
        content: ref.content,
      },
    });
    created++;
  }

  console.log(`  Regulatory references: ${created} upserted`);
}

async function seedNioshList() {
  console.log("Seeding NIOSH hazardous drug list metadata...");
  const data = loadJson("niosh-hazardous-drugs.json");

  await prisma.regulatoryReference.upsert({
    where: {
      source_title_version: {
        source: "NIOSH",
        title: "NIOSH List of Hazardous Drugs in Healthcare Settings",
        version: "2024",
      },
    },
    update: { content: data },
    create: {
      source: "NIOSH",
      title: "NIOSH List of Hazardous Drugs in Healthcare Settings",
      version: "2024",
      effectiveDate: new Date("2024-01-01"),
      content: data,
    },
  });

  console.log(
    `  NIOSH list stored: ${data.table1_antineoplastic.length} Table 1 + ${data.table2_non_antineoplastic.length} Table 2 + ${data.table3_reproductive_risk.length} Table 3 drugs`
  );
}

async function seedDemoPharmacyAndUser() {
  console.log("Seeding demo pharmacy and user...");

  const pharmacy = await prisma.pharmacy.upsert({
    where: { licenseNumber: "OCP-DEMO-001" },
    update: {},
    create: {
      name: "Demo Compounding Pharmacy",
      licenseNumber: "OCP-DEMO-001",
      address: "123 Main Street, Toronto, ON M5V 1A1",
      facilityLevel: "B",
      hasMechanicalVentilation: true,
      hasBSC: false,
      hasEyewash: true,
    },
  });

  const hashedPassword = await bcrypt.hash("demo123", 10);

  await prisma.user.upsert({
    where: { email: "pharmacist@demo.com" },
    update: {},
    create: {
      email: "pharmacist@demo.com",
      password: hashedPassword,
      name: "Dr. Jane Smith",
      role: "PHARMACIST",
      pharmacyId: pharmacy.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@demo.com" },
    update: {},
    create: {
      email: "supervisor@demo.com",
      password: hashedPassword,
      name: "Dr. John Doe",
      role: "SUPERVISOR",
      pharmacyId: pharmacy.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
      pharmacyId: pharmacy.id,
    },
  });

  const shereenPass = await bcrypt.hash("shereen", 10);
  await prisma.user.upsert({
    where: { email: "shereen" },
    update: { password: shereenPass },
    create: {
      email: "shereen",
      password: shereenPass,
      name: "Shereen",
      role: "PHARMACIST",
      pharmacyId: pharmacy.id,
    },
  });

  const elsayadPass = await bcrypt.hash("elsayad", 10);
  await prisma.user.upsert({
    where: { email: "elsayad" },
    update: { password: elsayadPass },
    create: {
      email: "elsayad",
      password: elsayadPass,
      name: "Elsayad",
      role: "SUPERVISOR",
      pharmacyId: pharmacy.id,
    },
  });

  console.log(`  Demo pharmacy: ${pharmacy.name} (${pharmacy.licenseNumber})`);
  console.log("  Users: shereen/shereen (Pharmacist), elsayad/elsayad (Supervisor)");
}

async function main() {
  console.log("\n=== Pharmacy Compliance Platform - Database Seed ===\n");
  console.log(`Database: ${process.env.DATABASE_URL?.split("@")[1] || "local"}`);
  console.log("");

  try {
    await seedIngredients();
    await seedRegulatoryReferences();
    await seedNioshList();
    await seedDemoPharmacyAndUser();

    const ingredientCount = await prisma.ingredient.count();
    const refCount = await prisma.regulatoryReference.count();
    const userCount = await prisma.user.count();

    console.log("\n=== Seed Complete ===");
    console.log(`  Total ingredients: ${ingredientCount}`);
    console.log(`  Total regulatory references: ${refCount}`);
    console.log(`  Total users: ${userCount}`);
    console.log("");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
