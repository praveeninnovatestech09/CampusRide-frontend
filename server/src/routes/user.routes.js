import { Router } from "express";
import { z } from "zod";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate } from "../middleware/error.js";

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  college: z.string().trim().min(2).max(120),
  department: z.string().trim().max(80).optional().default(""),
  year: z.string().trim().max(20).optional().default(""),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]*$/, "Phone can only contain digits, spaces, + and -")
    .optional()
    .default(""),
  bio: z.string().trim().max(300).optional().default(""),
});

router.put(
  "/me",
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user.id, req.validated, { new: true, runValidators: true });
    res.json({ user });
  }),
);

export default router;
