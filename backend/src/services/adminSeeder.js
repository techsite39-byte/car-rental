import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const DEFAULT_ADMIN_EMAIL = "yourssanjay63@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "admin123456#";

function adminSeedConfig() {
  return {
    email: (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
    password: process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    name: process.env.ADMIN_INITIAL_NAME?.trim() || "Super Admin",
  };
}

async function seedInitialAdmin() {
  const { email, password, name } = adminSeedConfig();
  const existing = await Admin.findOne({ email }).select("_id").lean();
  if (existing) {
    return { created: false, email };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({
    name,
    email,
    password: passwordHash,
    role: "admin",
    isActive: true,
  });
  return { created: true, email };
}

export { adminSeedConfig, seedInitialAdmin };
