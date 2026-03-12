-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PHARMACIST', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "NioshTable" AS ENUM ('NONE', 'TABLE_1', 'TABLE_2', 'TABLE_3');

-- CreateEnum
CREATE TYPE "PhysicalForm" AS ENUM ('POWDER', 'LIQUID', 'SEMI_SOLID', 'GEL', 'CAPSULE', 'TABLET', 'OTHER');

-- CreateEnum
CREATE TYPE "GloveType" AS ENUM ('REGULAR_NITRILE', 'CHEMOTHERAPY_RATED', 'DOUBLE_CHEMO');

-- CreateEnum
CREATE TYPE "RespiratoryType" AS ENUM ('NOT_REQUIRED', 'DUST_MASK', 'N95', 'PAPR');

-- CreateEnum
CREATE TYPE "VentilationType" AS ENUM ('GENERAL', 'LOCAL_EXHAUST', 'BSC', 'CVE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ComplexityLevel" AS ENUM ('SIMPLE', 'MODERATE', 'COMPLEX');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MfrStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "IngredientSource" AS ENUM ('NIOSH', 'MANUAL', 'SDS', 'PUBCHEM', 'HEALTH_CANADA', 'SEED');

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "license_number" TEXT,
    "address" TEXT,
    "facility_level" TEXT DEFAULT 'A',
    "has_mechanical_ventilation" BOOLEAN NOT NULL DEFAULT false,
    "has_bsc" BOOLEAN NOT NULL DEFAULT false,
    "has_eyewash" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PHARMACIST',
    "pharmacy_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cas_number" TEXT,
    "niosh_table" "NioshTable" NOT NULL DEFAULT 'NONE',
    "niosh_description" TEXT,
    "reproductive_toxicity" BOOLEAN NOT NULL DEFAULT false,
    "ghs_category" TEXT,
    "physical_form" "PhysicalForm" NOT NULL DEFAULT 'POWDER',
    "whmis_hazards" JSONB NOT NULL DEFAULT '[]',
    "exposure_routes" JSONB NOT NULL DEFAULT '{}',
    "recommended_ppe" JSONB NOT NULL DEFAULT '{}',
    "ventilation_required" BOOLEAN NOT NULL DEFAULT false,
    "ventilation_type" "VentilationType" NOT NULL DEFAULT 'GENERAL',
    "sds_document_url" TEXT,
    "sds_expiry_date" TIMESTAMP(3),
    "source" "IngredientSource" NOT NULL DEFAULT 'MANUAL',
    "health_canada_din" TEXT,
    "pubchem_cid" TEXT,
    "molecular_formula" TEXT,
    "molecular_weight" DOUBLE PRECISION,
    "synonyms" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_formulation_records" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "protocol_number" TEXT,
    "product_name" TEXT NOT NULL,
    "concentration" TEXT,
    "form" TEXT NOT NULL,
    "route" TEXT,
    "frequency" TEXT,
    "batch_size" INTEGER,
    "compounding_method" TEXT,
    "equipment_required" JSONB NOT NULL DEFAULT '[]',
    "quality_controls" JSONB NOT NULL DEFAULT '[]',
    "storage" TEXT,
    "beyond_use_date" TEXT,
    "status" "MfrStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_formulation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfr_ingredients" (
    "id" TEXT NOT NULL,
    "mfr_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "quantity" TEXT,
    "is_active_ingredient" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mfr_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "mfr_id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "complexity_level" "ComplexityLevel",
    "complexity_justification" TEXT,
    "frequency_assessment" JSONB,
    "exposure_risks" JSONB,
    "recommended_ppe" JSONB,
    "facility_controls" JSONB,
    "risk_level" "RiskLevel",
    "rationale" TEXT,
    "references" JSONB NOT NULL DEFAULT '[]',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_audit" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_by_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_version" JSONB,
    "notes" TEXT,

    CONSTRAINT "assessment_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_references" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT,
    "effective_date" TIMESTAMP(3),
    "content" JSONB NOT NULL DEFAULT '{}',
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_license_number_key" ON "pharmacies"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_cas_number_key" ON "ingredients"("name", "cas_number");

-- CreateIndex
CREATE UNIQUE INDEX "mfr_ingredients_mfr_id_ingredient_id_key" ON "mfr_ingredients"("mfr_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_references_source_title_version_key" ON "regulatory_references"("source", "title", "version");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_formulation_records" ADD CONSTRAINT "master_formulation_records_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_formulation_records" ADD CONSTRAINT "master_formulation_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfr_ingredients" ADD CONSTRAINT "mfr_ingredients_mfr_id_fkey" FOREIGN KEY ("mfr_id") REFERENCES "master_formulation_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfr_ingredients" ADD CONSTRAINT "mfr_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_mfr_id_fkey" FOREIGN KEY ("mfr_id") REFERENCES "master_formulation_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_audit" ADD CONSTRAINT "assessment_audit_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "risk_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_audit" ADD CONSTRAINT "assessment_audit_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
