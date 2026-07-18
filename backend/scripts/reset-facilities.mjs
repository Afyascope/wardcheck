#!/usr/bin/env node

/**
 * Delete all facilities and import history so a fresh KMPDC re-import
 * can recreate records with the original registration numbers.
 *
 * Usage:  node scripts/reset-facilities.mjs
 *
 * This script is destructive — it removes ALL facilities, reports,
 * import history, and import history errors.
 */

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    const facilityCount = await prisma.facility.count();
    const reportCount = await prisma.report.count();
    const importCount = await prisma.importHistory.count();
    const errorCount = await prisma.importHistoryError.count();

    console.log(`Current data:`);
    console.log(`  Facilities:         ${facilityCount}`);
    console.log(`  Reports:            ${reportCount}`);
    console.log(`  Import history:     ${importCount}`);
    console.log(`  Import errors:      ${errorCount}`);
    console.log();

    if (facilityCount === 0) {
      console.log("No facilities to delete. Nothing to do.");
      return;
    }

    // Reports cascade-delete with facilities, but delete explicitly for clarity
    const deletedReports = await prisma.report.deleteMany();
    console.log(`✓ Deleted ${deletedReports.count} reports`);

    const deletedErrors = await prisma.importHistoryError.deleteMany();
    console.log(`✓ Deleted ${deletedErrors.count} import history errors`);

    const deletedImports = await prisma.importHistory.deleteMany();
    console.log(`✓ Deleted ${deletedImports.count} import history records`);

    const deletedFacilities = await prisma.facility.deleteMany();
    console.log(`✓ Deleted ${deletedFacilities.count} facilities`);

    console.log();
    console.log("Database is clean. Trigger a new KMPDC sync from the admin UI.");
  } catch (error) {
    console.error("Failed to reset facilities:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
