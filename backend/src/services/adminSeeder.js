import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

export function adminSeedConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password?.trim()) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD must be configured before admin bootstrap.",
    );
  }

  return {
    email,
    password,
    name: process.env.ADMIN_INITIAL_NAME?.trim() || "Super Admin",
  };
}

async function seedInitialAdmin() {
  const { email, password, name } = adminSeedConfig();
  const existing = await Admin.findOne({}).select("_id email").lean();
  if (existing) {
    return { created: false, email: existing.email };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await Admin.create({
      name,
      email,
      password: passwordHash,
      role: "admin",
      isActive: true,
    });
    return { created: true, email };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existingAfterConflict = await Admin.findOne({})
      .select("_id email")
      .lean();
    if (!existingAfterConflict) throw error;
    return { created: false, email: existingAfterConflict.email };
  }
}

export { seedInitialAdmin };
