import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/ingredients - List all (with search, pagination, filtering)
router.get("/", async (req, res) => {
  try {
    const {
      search,
      niosh,
      source,
      page = 1,
      limit = 50,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { casNumber: { contains: search, mode: "insensitive" } },
        { synonyms: { array_contains: [search] } },
      ];
    }

    if (niosh) {
      where.nioshTable = niosh;
    }

    if (source) {
      where.source = source;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.ingredient.count({ where }),
    ]);

    res.json({
      ingredients,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error("Ingredients list error:", err);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// GET /api/ingredients/search?q=term - Quick search for autocomplete
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { casNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    res.json(ingredients);
  } catch (err) {
    console.error("Ingredient search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/ingredients/stats/summary - Database statistics (must be before /:id)
router.get("/stats/summary", async (_req, res) => {
  try {
    const [total, nioshTable1, nioshTable2, nioshTable3, nonHazardous] =
      await Promise.all([
        prisma.ingredient.count(),
        prisma.ingredient.count({ where: { nioshTable: "TABLE_1" } }),
        prisma.ingredient.count({ where: { nioshTable: "TABLE_2" } }),
        prisma.ingredient.count({ where: { nioshTable: "TABLE_3" } }),
        prisma.ingredient.count({ where: { nioshTable: "NONE" } }),
      ]);

    res.json({
      total,
      byNioshTable: {
        TABLE_1: nioshTable1,
        TABLE_2: nioshTable2,
        TABLE_3: nioshTable3,
        NONE: nonHazardous,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/ingredients/:id - Get single ingredient
router.get("/:id", async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: req.params.id },
    });
    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.json(ingredient);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

// POST /api/ingredients - Create new ingredient (auth required)
router.post("/", authenticate, requireRole("ADMIN", "PHARMACIST"), async (req, res) => {
  try {
    const {
      name,
      casNumber,
      nioshTable,
      nioshDescription,
      reproductiveToxicity,
      ghsCategory,
      physicalForm,
      whmisHazards,
      exposureRoutes,
      recommendedPPE,
      ventilationRequired,
      ventilationType,
      molecularFormula,
      molecularWeight,
      synonyms,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Ingredient name is required" });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        casNumber: casNumber || null,
        nioshTable: nioshTable || "NONE",
        nioshDescription: nioshDescription || null,
        reproductiveToxicity: reproductiveToxicity || false,
        ghsCategory: ghsCategory || null,
        physicalForm: physicalForm || "POWDER",
        whmisHazards: whmisHazards || [],
        exposureRoutes: exposureRoutes || {},
        recommendedPPE: recommendedPPE || {},
        ventilationRequired: ventilationRequired || false,
        ventilationType: ventilationType || "GENERAL",
        molecularFormula: molecularFormula || null,
        molecularWeight: molecularWeight || null,
        synonyms: synonyms || [],
        source: "MANUAL",
      },
    });

    res.status(201).json(ingredient);
  } catch (err) {
    console.error("Create ingredient error:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Ingredient with this name and CAS already exists" });
    }
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

// PUT /api/ingredients/:id - Update ingredient (auth required)
router.put("/:id", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(ingredient);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    res.status(500).json({ error: "Failed to update ingredient" });
  }
});

export default router;
