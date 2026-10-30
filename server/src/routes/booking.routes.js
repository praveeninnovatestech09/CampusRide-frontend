import { Router } from "express";
import { z } from "zod";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import { notify } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate, HttpError } from "../middleware/error.js";

const router = Router();
router.use(requireAuth);

const RIDE_POP = { path: "ride", populate: { path: "driver", select: "name college phone" } };

// Bookings I made as a passenger
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ passenger: req.user.id }).sort({ createdAt: -1 }).populate(RIDE_POP);
    res.json({ bookings });
  }),
);

// Requests on rides I drive
router.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ driver: req.user.id })
      .sort({ createdAt: -1 })
      .populate("ride")
      .populate("passenger", "name college department year phone");
    res.json({ bookings });
  }),
);

const respondSchema = z.object({ status: z.enum(["accepted", "rejected"]) });

// Driver accepts or rejects
router.patch(
  "/:id/respond",
  validate(respondSchema),
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (!booking.driver.equals(req.user.id)) throw new HttpError(403, "Only the driver can respond");
    if (booking.status !== "pending") throw new HttpError(400, `Booking is already ${booking.status}`);

    const ride = await Ride.findById(booking.ride);
    if (req.validated.status === "accepted") {
      // Atomic seat decrement guards against overbooking
      const updated = await Ride.findOneAndUpdate(
        { _id: booking.ride, status: "active", seatsAvailable: { $gte: booking.seats } },
        { $inc: { seatsAvailable: -booking.seats } },
        { new: true },
      );
      if (!updated) throw new HttpError(400, "Not enough seats left to accept this request");
    }
    booking.status = req.validated.status;
    await booking.save();
    await notify(
      booking.passenger,
      req.validated.status === "accepted" ? "booking_accepted" : "booking_rejected",
      `Your request for ${ride.from} → ${ride.to} was ${req.validated.status}.`,
      ride.id,
    );
    res.json({ booking });
  }),
);

// Passenger cancels their own booking
router.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (!booking.passenger.equals(req.user.id)) throw new HttpError(403, "Not your booking");
    if (!["pending", "accepted"].includes(booking.status)) throw new HttpError(400, `Booking is already ${booking.status}`);
    const wasAccepted = booking.status === "accepted";
    booking.status = "cancelled";
    await booking.save();
    const ride = wasAccepted
      ? await Ride.findByIdAndUpdate(booking.ride, { $inc: { seatsAvailable: booking.seats } }, { new: true })
      : await Ride.findById(booking.ride);
    await notify(booking.driver, "booking_cancelled", `${req.user.name} cancelled their booking on ${ride.from} → ${ride.to}.`, ride.id);
    res.json({ booking });
  }),
);

export default router;
