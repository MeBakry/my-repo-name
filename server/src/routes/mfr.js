import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/mfr - List MFRs for user's pharmacy
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = { pharmacyId: req.user.pharmacyId };

    if (status) where.status = status;
    if (search) {
      where.productName = { contains: search, mode: "insensitive" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [mfrs, total] = await Promise.all([
      prisma.masterFormulationRecord.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          ingredients: { include: { ingredient: true } },
          createdBy: { select: { name: true } },
          _count: { select: { assessments: true } },
          assessments: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              id: true,
              version: true,
              riskLevel: true,
              status: true,
              generatedAt: true,
              nextReviewDate: true,
            },
          },
        },
      }),
      prisma.masterFormulationRecord.count({ where }),
    ]);

    res.json({
      mfrs,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    console.error("MFR list error:", err);
    res.status(500).json({ error: "Failed to fetch MFRs" });
  }
});

// GET /api/mfr/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const mfr = await prisma.masterFormulationRecord.findFirst({
      where: { id: req.params.id, pharmacyId: req.user.pharmacyId },
      include: {
        ingredients: { include: { ingredient: true } },
        createdBy: { select: { name: true, email: true } },
        assessments: {
          orderBy: { version: "desc" },
          take: 5,
          select: { id: true, version: true, riskLevel: true, status: true, generatedAt: true },
        },
      },
    });

    if (!mfr) return res.status(404).json({ error: "MFR not found" });
    res.json(mfr);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch MFR" });
  }
});

// POST /api/mfr - Create new MFR
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      productName,
      concentration,
      protocolNumber,
      form,
      route,
      frequency,
      batchSize,
      compoundingMethod,
      equipmentRequired,
      qualityControls,
      storage,
      beyondUseDate,
      ingredientIds,
    } = req.body;

    if (!productName || !form) {
      return res.status(400).json({ error: "Product name and form are required" });
    }

    const mfr = await prisma.masterFormulationRecord.create({
      data: {
        pharmacyId: req.user.pharmacyId,
        productName,
        concentration: concentration || null,
        protocolNumber: protocolNumber || null,
        form,
        route: route || null,
        frequency: frequency || null,
        batchSize: batchSize ? parseInt(batchSize) : null,
        compoundingMethod: compoundingMethod || null,
        equipmentRequired: equipmentRequired || [],
        qualityControls: qualityControls || [],
        storage: storage || null,
        beyondUseDate: beyondUseDate || null,
        status: "DRAFT",
        createdById: req.user.id,
        ingredients: ingredientIds
          ? {
              create: ingredientIds.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity || null,
                isActiveIngredient: item.isActiveIngredient !== false,
              })),
            }
          : undefined,
      },
      include: {
        ingredients: { include: { ingredient: true } },
        createdBy: { select: { name: true } },
      },
    });

    res.status(201).json(mfr);
  } catch (err) {
    console.error("Create MFR error:", err);
    res.status(500).json({ error: "Failed to create MFR" });
  }
});

// PUT /api/mfr/:id
router.put("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.masterFormulationRecord.findFirst({
      where: { id: req.params.id, pharmacyId: req.user.pharmacyId },
    });
    if (!existing) return res.status(404).json({ error: "MFR not found" });

    const { ingredientIds, ...updateData } = req.body;

    if (ingredientIds) {
      await prisma.mfrIngredient.deleteMany({ where: { mfrId: req.params.id } });
      await prisma.mfrIngredient.createMany({
        data: ingredientIds.map((item) => ({
          mfrId: req.params.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity || null,
          isActiveIngredient: item.isActiveIngredient !== false,
        })),
      });
    }

    const mfr = await prisma.masterFormulationRecord.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        ingredients: { include: { ingredient: true } },
        createdBy: { select: { name: true } },
      },
    });

    res.json(mfr);
  } catch (err) {
    res.status(500).json({ error: "Failed to update MFR" });
  }
});

// PUT /api/mfr/:id/archive
router.put("/:id/archive", authenticate, async (req, res) => {
  try {
    const mfr = await prisma.masterFormulationRecord.updateMany({
      where: { id: req.params.id, pharmacyId: req.user.pharmacyId },
      data: { status: "ARCHIVED" },
    });
    if (mfr.count === 0) return res.status(404).json({ error: "MFR not found" });
    res.json({ message: "MFR archived" });
  } catch (err) {
    res.status(500).json({ error: "Failed to archive MFR" });
  }
});

export default router;
