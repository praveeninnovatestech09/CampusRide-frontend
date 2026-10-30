import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    from: { type: String, required: true, trim: true, maxlength: 120 },
    to: { type: String, required: true, trim: true, maxlength: 120 },
    departureAt: { type: Date, required: true, index: true },
    totalSeats: { type: Number, required: true, min: 1, max: 8 },
    seatsAvailable: { type: Number, required: true, min: 0, max: 8 },
    pricePerSeat: { type: Number, required: true, min: 0, max: 10000 },
    vehicle: { type: String, trim: true, maxlength: 80, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["active", "cancelled", "completed"], default: "active" },
  },
  { timestamps: true },
);

rideSchema.index({ from: "text", to: "text" });

export default mongoose.model("Ride", rideSchema);
