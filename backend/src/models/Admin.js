import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["admin"], default: "admin" },
    isActive: { type: Boolean, required: true, default: true },
    googleId: { type: String, trim: true, default: undefined },
  },
  {
    collection: "admins",
    timestamps: true,
    versionKey: false,
  },
);

adminSchema.index({ email: 1 }, { unique: true });

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;
