import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json({ notifications, unread: notifications.filter((n) => !n.read).length });
  }),
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ ok: true });
  }),
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true });
    if (!n) throw new HttpError(404, "Notification not found");
    res.json({ notification: n });
  }),
);

export default router;
