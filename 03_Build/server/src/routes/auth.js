import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { generateToken, authenticate } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { pharmacy: { select: { id: true, name: true, facilityLevel: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pharmacy: user.pharmacy,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, pharmacyId } = req.body;
    if (!email || !password || !name || !pharmacyId) {
      return res
        .status(400)
        .json({ error: "Email, password, name, and pharmacyId are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) {
      return res.status(404).json({ error: "Pharmacy not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "PHARMACIST",
        pharmacyId,
      },
      include: { pharmacy: { select: { id: true, name: true, facilityLevel: true } } },
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pharmacy: user.pharmacy,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { pharmacy: { select: { id: true, name: true, facilityLevel: true } } },
    });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      pharmacy: user.pharmacy,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
