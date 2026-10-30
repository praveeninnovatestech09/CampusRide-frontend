import { Router } from "express";
import { z } from "zod";
import Ride from "../models/Ride.js";
import Booking from "../models/Booking.js";
import { notify } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, validate, HttpError } from "../middleware/error.js";

const router = Router();
const DRIVER_FIELDS = "name college department year";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchSchema = z.object({
  from: z.string().trim().max(120).optional(),
  to: z.string().trim().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  seats: z.coerce.number().int().min(1).max(8).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["soonest", "cheapest"]).optional(),
});

const rideSchema = z
  .object({
    from: z.string().trim().min(2, "Pickup is required").max(120),
    to: z.string().trim().min(2, "Destination is required").max(120),
    departureAt: z.coerce.date(),
    totalSeats: z.coerce.number().int().min(1, "At least 1 seat").max(8, "At most 8 seats"),
    pricePerSeat: z.coerce.number().min(0, "Cost cannot be negative").max(10000),
    vehicle: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .refine((d) => d.departureAt.getTime() > Date.now(), { message: "Departure must be in the future", path: ["departureAt"] })
  .refine((d) => d.from.toLowerCase() !== d.to.toLowerCase(), { message: "Pickup and destination must differ", path: ["to"] });

const bookingSchema = z.object({
  seats: z.coerce.number().int().min(1).max(8),
  message: z.string().trim().max(300).optional().default(""),
});

// Public search
router.get(
  "/",
  validate(searchSchema, "query"),
  asyncHandler(async (req, res) => {
    const { from, to, date, seats, maxPrice, sort } = req.validated;
    const filter = { status: "active", departureAt: { $gte: new Date() }, seatsAvailable: { $gte: seats || 1 } };
    if (from) filter.from = { $regex: escapeRegex(from), $options: "i" };
    if (to) filter.to = { $regex: escapeRegex(to), $options: "i" };
    if (maxPrice !== undefined) filter.pricePerSeat = { $lte: maxPrice };
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      filter.departureAt = { $gte: start < new Date() ? new Date() : start, $lt: end };
    }
    const rides = await Ride.find(filter)
      .sort(sort === "cheapest" ? { pricePerSeat: 1 } : { departureAt: 1 })
      .limit(50)
      .populate("driver", DRIVER_FIELDS);
    res.json({ rides });
  }),
);

// Rides I am driving
router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rides = await Ride.find({ driver: req.user.id }).sort({ departureAt: -1 }).populate("driver", DRIVER_FIELDS);
    res.json({ rides });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id).populate("driver", DRIVER_FIELDS);
    if (!ride) throw new HttpError(404, "Ride not found");
    res.json({ ride });
  }),
);

router.post(
  "/",
  requireAuth,
  validate(rideSchema),
  asyncHandler(async (req, res) => {
    const data = req.validated;
    const ride = await Ride.create({ ...data, seatsAvailable: data.totalSeats, driver: req.user.id });
    res.status(201).json({ ride });
  }),
);

router.patch(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id);
    if (!ride) throw new HttpError(404, "Ride not found");
    if (!ride.driver.equals(req.user.id)) throw new HttpError(403, "Only the driver can cancel this ride");
    if (ride.status !== "active") throw new HttpError(400, "Ride is not active");
    ride.status = "cancelled";
    await ride.save();
    const bookings = await Booking.find({ ride: ride.id, status: { $in: ["pending", "accepted"] } });
    await Booking.updateMany({ ride: ride.id, status: { $in: ["pending", "accepted"] } }, { status: "cancelled" });
    await Promise.all(
      bookings.map((b) => notify(b.passenger, "ride_cancelled", `Your ride ${ride.from} → ${ride.to} was cancelled by the driver.`, ride.id)),
    );
    res.json({ ride });
  }),
);

// Request a booking on a ride
router.post(
  "/:id/bookings",
  requireAuth,
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.status !== "active") throw new HttpError(404, "Ride not available");
    if (ride.departureAt < new Date()) throw new HttpError(400, "This ride has already departed");
    if (ride.driver.equals(req.user.id)) throw new HttpError(400, "You cannot book your own ride");
    if (req.validated.seats > ride.seatsAvailable) throw new HttpError(400, `Only ${ride.seatsAvailable} seat(s) left`);
    const existing = await Booking.findOne({ ride: ride.id, passenger: req.user.id, status: { $in: ["pending", "accepted"] } });
    if (existing) throw new HttpError(409, "You already have a request for this ride");
    const booking = await Booking.create({ ...req.validated, ride: ride.id, passenger: req.user.id, driver: ride.driver });
    await notify(ride.driver, "booking_request", `${req.user.name} requested ${booking.seats} seat(s) on ${ride.from} → ${ride.to}.`, ride.id);
    res.status(201).json({ booking });
  }),
);

export default router;
