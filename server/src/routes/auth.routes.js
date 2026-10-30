import { Router } from "express";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { asyncHandler, validate, HttpError } from "../middleware/error.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  college: z.string().trim().min(2, "College is required").max(120),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await User.create(req.validated);
    res.status(201).json({ token: signToken(user.id), user });
  }),
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.validated;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, "Incorrect email or password");
    }
    res.json({ token: signToken(user.id), user });
  }),
);

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
