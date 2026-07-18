#!/usr/bin/env node

/**
 * Seed the first administrator account.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@wardcheck.co.ke ADMIN_PASSWORD=YourSecurePassword123! node scripts/seed-admin.mjs
 *
 * Or via npm:
 *   npm run seed:admin
 *
 * Environment variables:
 *   ADMIN_EMAIL    – Admin email address (required)
 *   ADMIN_PASSWORD – Admin password, min 8 characters (required)
 *   ADMIN_NAME     – Admin display name (defaults to "Administrator")
 *
 * The script is idempotent: it skips if an admin with the same email already exists.
 * After the first admin is created, no public bootstrap endpoint is available.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    console.error('');
    console.error('Usage:');
    console.error('  ADMIN_EMAIL=admin@wardcheck.co.ke ADMIN_PASSWORD=YourSecurePassword123! node scripts/seed-admin.mjs');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: ADMIN_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin with email "${email}" already exists. Skipping.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });

    console.log(`✓ Admin created successfully.`);
    console.log(`  ID:    ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Role:  ${admin.role}`);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
