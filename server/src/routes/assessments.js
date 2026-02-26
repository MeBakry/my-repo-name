import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { generateAssessment } from "../services/ruleEngine.js";

const router = Router();

// POST /api/assessments/generate - Generate a risk assessment from an MFR
router.post("/generate", authenticate, async (req, res) => {
  try {
    const { mfrId } = req.body;
    if (!mfrId) {
      return res.status(400).json({ error: "mfrId is required" });
    }

    const mfr = await prisma.masterFormulationRecord.findFirst({
      where: { id: mfrId, pharmacyId: req.user.pharmacyId },
      include: { ingredients: { include: { ingredient: true } } },
    });

    if (!mfr) return res.status(404).json({ error: "MFR not found" });

    const formData = {
      productName: mfr.productName,
      concentration: mfr.concentration,
      form: mfr.form,
      route: mfr.route,
      frequency: mfr.frequency || "Weekly",
      batchSize: mfr.batchSize || 30,
    };

    const ingredientHazards = mfr.ingredients.map((mi) => ({
      name: mi.ingredient.name,
      cas: mi.ingredient.casNumber,
      nioshTable: mi.ingredient.nioshTable,
      nioshDescription: mi.ingredient.nioshDescription,
      reproductiveToxicity: mi.ingredient.reproductiveToxicity,
      ghsCategory: mi.ingredient.ghsCategory,
      physicalForm: mi.ingredient.physicalForm,
      whmisHazards: mi.ingredient.whmisHazards,
      exposureRoutes: mi.ingredient.exposureRoutes,
      recommendedPPE: mi.ingredient.recommendedPPE,
      ventilationRequired: mi.ingredient.ventilationRequired,
      ventilationType: mi.ingredient.ventilationType,
    }));

    const assessment = generateAssessment(formData, ingredientHazards);

    const latestVersion = await prisma.riskAssessment.findFirst({
      where: { mfrId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    const saved = await prisma.riskAssessment.create({
      data: {
        mfrId,
        pharmacyId: req.user.pharmacyId,
        version: newVersion,
        complexityLevel: assessment.complexity.level,
        complexityJustification: assessment.complexity.justification,
        frequencyAssessment: assessment.frequencyAssessment,
        exposureRisks: assessment.exposureRisks,
        recommendedPPE: assessment.recommendedPPE,
        facilityControls: assessment.facilityControls,
        riskLevel: assessment.riskLevel.level,
        rationale: assessment.riskLevel.rationale,
        references: assessment.references,
        status: "DRAFT",
        createdById: req.user.id,
        nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.assessmentAudit.create({
      data: {
        assessmentId: saved.id,
        action: "CREATED",
        changedById: req.user.id,
        notes: `Risk assessment v${newVersion} auto-generated from MFR`,
      },
    });

    res.status(201).json({
      ...saved,
      assessment,
    });
  } catch (err) {
    console.error("Generate assessment error:", err);
    res.status(500).json({ error: "Failed to generate assessment" });
  }
});

// POST /api/assessments/generate-preview - Preview without saving
router.post("/generate-preview", async (req, res) => {
  try {
    const { formData, ingredientHazards } = req.body;
    if (!formData || !ingredientHazards) {
      return res.status(400).json({ error: "formData and ingredientHazards are required" });
    }

    const assessment = generateAssessment(formData, ingredientHazards);
    res.json(assessment);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ error: "Failed to generate preview" });
  }
});

// GET /api/assessments - List assessments for user's pharmacy
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, mfrId, page = 1, limit = 20 } = req.query;
    const where = { pharmacyId: req.user.pharmacyId };

    if (status) where.status = status;
    if (mfrId) where.mfrId = mfrId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [assessments, total] = await Promise.all([
      prisma.riskAssessment.findMany({
        where,
        skip,
        take,
        orderBy: { generatedAt: "desc" },
        include: {
          mfr: { select: { productName: true, concentration: true, form: true } },
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
      }),
      prisma.riskAssessment.count({ where }),
    ]);

    res.json({
      assessments,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

// GET /api/assessments/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const assessment = await prisma.riskAssessment.findFirst({
      where: { id: req.params.id, pharmacyId: req.user.pharmacyId },
      include: {
        mfr: {
          include: { ingredients: { include: { ingredient: true } } },
        },
        createdBy: { select: { name: true, email: true } },
        approvedBy: { select: { name: true, email: true } },
        auditLogs: {
          orderBy: { changedAt: "desc" },
          include: { changedBy: { select: { name: true } } },
        },
      },
    });

    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
});

// PUT /api/assessments/:id/submit - Submit for review
router.put("/:id/submit", authenticate, async (req, res) => {
  try {
    const assessment = await prisma.riskAssessment.updateMany({
      where: { id: req.params.id, pharmacyId: req.user.pharmacyId, status: "DRAFT" },
      data: { status: "PENDING_REVIEW" },
    });

    if (assessment.count === 0) {
      return res.status(404).json({ error: "Assessment not found or not in DRAFT status" });
    }

    await prisma.assessmentAudit.create({
      data: {
        assessmentId: req.params.id,
        action: "SUBMITTED_FOR_REVIEW",
        changedById: req.user.id,
        notes: "Assessment submitted for supervisor review",
      },
    });

    res.json({ message: "Assessment submitted for review" });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

// PUT /api/assessments/:id/approve - Approve assessment (supervisor only)
router.put(
  "/:id/approve",
  authenticate,
  requireRole("SUPERVISOR", "ADMIN"),
  async (req, res) => {
    try {
      const updated = await prisma.riskAssessment.updateMany({
        where: {
          id: req.params.id,
          pharmacyId: req.user.pharmacyId,
          status: "PENDING_REVIEW",
        },
        data: {
          status: "APPROVED",
          approvedById: req.user.id,
          approvedAt: new Date(),
          nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      if (updated.count === 0) {
        return res
          .status(404)
          .json({ error: "Assessment not found or not in PENDING_REVIEW status" });
      }

      await prisma.assessmentAudit.create({
        data: {
          assessmentId: req.params.id,
          action: "APPROVED",
          changedById: req.user.id,
          notes: req.body.notes || "Assessment approved by supervisor",
        },
      });

      res.json({ message: "Assessment approved" });
    } catch (err) {
      res.status(500).json({ error: "Failed to approve assessment" });
    }
  }
);

export default router;
