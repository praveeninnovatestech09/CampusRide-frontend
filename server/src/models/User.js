import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    college: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, trim: true, maxlength: 80, default: "" },
    year: { type: String, trim: true, maxlength: 20, default: "" },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    bio: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hash(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function compare(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
