import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const errors = await prisma.importHistoryError.findMany({
    select: { rawData: true },
  });

  // Extract registration numbers from rawData
  const regNumbers = [];
  for (const e of errors) {
    if (e.rawData && typeof e.rawData === 'object') {
      // column_3 is the registration number based on the pattern we saw
      const reg = e.rawData.column_3;
      if (reg) regNumbers.push(String(reg));
    }
  }

  console.log(`Total registration numbers from errors: ${regNumbers.length}`);
  
  // Count unique
  const counts = {};
  for (const r of regNumbers) {
    counts[r] = (counts[r] || 0) + 1;
  }
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log(`Unique registration numbers: ${sorted.length}`);
  console.log(`\nTop 20 most duplicated:`);
  for (const [reg, count] of sorted.slice(0, 20)) {
    console.log(`  ${reg.padEnd(15)} × ${count}`);
  }

  // How many contain *?
  const withAsterisk = regNumbers.filter(r => r.includes('*'));
  const withoutAsterisk = regNumbers.filter(r => !r.includes('*'));
  console.log(`\nWith asterisks: ${withAsterisk.length}`);
  console.log(`Without asterisks: ${withoutAsterisk.length}`);
  
  // How many unique values among asterisk ones?
  const uniqueAsterisk = new Set(withAsterisk);
  console.log(`Unique values with asterisks: ${uniqueAsterisk.size}`);
  console.log(`Collisions (duplicate masked values): ${withAsterisk.length - uniqueAsterisk.size}`);
  
  // For non-asterisk ones, how many are duplicated?
  const nonAsteriskCounts = {};
  for (const r of withoutAsterisk) {
    nonAsteriskCounts[r] = (nonAsteriskCounts[r] || 0) + 1;
  }
  const dupedNonAsterisk = Object.entries(nonAsteriskCounts).filter(([, c]) => c > 1);
  console.log(`Non-asterisk values that are duplicated: ${dupedNonAsterisk.length}`);
  for (const [reg, count] of dupedNonAsterisk.slice(0, 10)) {
    console.log(`  ${reg.padEnd(15)} × ${count}`);
  }
  
  // Also check: how many facilities were successfully created?
  const facilityCount = await prisma.facility.count();
  console.log(`\nFacilities successfully created: ${facilityCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
