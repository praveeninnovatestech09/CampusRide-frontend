import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["booking_request", "booking_accepted", "booking_rejected", "booking_cancelled", "ride_cancelled"],
      required: true,
    },
    message: { type: String, required: true, maxlength: 300 },
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Notification", notificationSchema);

export function notify(user, type, message, ride) {
  return mongoose.model("Notification").create({ user, type, message, ride });
}
