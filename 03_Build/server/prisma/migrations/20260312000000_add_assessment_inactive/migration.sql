-- AlterTable
ALTER TABLE "risk_assessments" ADD COLUMN "inactive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "risk_assessments" ADD COLUMN "inactivated_at" TIMESTAMP(3);
