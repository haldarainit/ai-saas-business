import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

interface BootstrapAdminConfig {
  email: string;
  password: string;
  name: string;
}

let bootstrapChecked = false;

function getBootstrapAdminConfig(): BootstrapAdminConfig | null {
  const email = (
    process.env.PRIMARY_ADMIN_EMAIL ||
    process.env.ADMIN_BOOTSTRAP_EMAIL ||
    ""
  )
    .trim()
    .toLowerCase();
  const password =
    process.env.PRIMARY_ADMIN_PASSWORD ||
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    "";
  const name = (
    process.env.PRIMARY_ADMIN_NAME ||
    process.env.ADMIN_BOOTSTRAP_NAME ||
    "PrimaryAdmin"
  ).trim();

  if (!email || !password) {
    return null;
  }

  return { email, password, name };
}

export async function ensureBootstrapAdminAccount() {
  if (bootstrapChecked) {
    return;
  }

  const config = getBootstrapAdminConfig();
  if (!config) {
    bootstrapChecked = true;
    return;
  }

  await dbConnect();

  const existingUser = await User.findOne({ email: config.email });
  if (existingUser) {
    let shouldSave = false;

    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      shouldSave = true;
    }

    const hasMatchingPassword = existingUser.password
      ? await bcrypt.compare(config.password, existingUser.password)
      : false;

    if (!hasMatchingPassword) {
      existingUser.password = await bcrypt.hash(config.password, 12);
      shouldSave = true;
    }

    if (!existingUser.planId) {
      existingUser.planId = "free";
      shouldSave = true;
    }

    if (!existingUser.planStatus) {
      existingUser.planStatus = "active";
      shouldSave = true;
    }

    if (!existingUser.planBillingCycle) {
      existingUser.planBillingCycle = "monthly";
      shouldSave = true;
    }

    if (!existingUser.accountStatus) {
      existingUser.accountStatus = "active";
      shouldSave = true;
    }

    if (typeof existingUser.sessionVersion !== "number" || existingUser.sessionVersion < 1) {
      existingUser.sessionVersion = 1;
      shouldSave = true;
    }

    if (typeof existingUser.rateLimitBonusCredits !== "number") {
      existingUser.rateLimitBonusCredits = 0;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingUser.save();
    }

    bootstrapChecked = true;
    return;
  }

  const hashedPassword = await bcrypt.hash(config.password, 12);

  try {
    await User.create({
      email: config.email,
      password: hashedPassword,
      name: config.name,
      role: "admin",
      planId: "free",
      planStatus: "active",
      planBillingCycle: "monthly",
      accountStatus: "active",
      sessionVersion: 1,
      rateLimitBonusCredits: 0,
      lastLoginAt: new Date(),
    });
  } catch (error) {
    const mongoError = error as { code?: number };
    if (mongoError.code !== 11000) {
      throw error;
    }
  }

  bootstrapChecked = true;
}
