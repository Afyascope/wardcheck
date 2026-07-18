import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const errors = await prisma.importHistoryError.findMany({
    select: { message: true, rawData: true, source: true, sourceRow: true },
    orderBy: { id: 'asc' },
    take: 5,
  });

  for (const [i, e] of errors.entries()) {
    console.log(`\n=== ERROR ${i + 1} (source=${e.source}, row=${e.sourceRow}) ===`);
    console.log(`FULL MESSAGE:\n${e.message}`);
    if (e.rawData && typeof e.rawData === 'object') {
      console.log(`RAW DATA:`, JSON.stringify(e.rawData, null, 2));
    }
  }

  // Also get unique message prefixes
  const allErrors = await prisma.importHistoryError.findMany({
    select: { message: true },
  });
  
  const prefixes = {};
  for (const e of allErrors) {
    // Get first 500 chars
    const key = (e.message || '').substring(0, 500);
    prefixes[key] = (prefixes[key] || 0) + 1;
  }
  
  console.log('\n\n=== UNIQUE MESSAGE PATTERNS ===');
  const sorted = Object.entries(prefixes).sort((a, b) => b[1] - a[1]);
  for (const [msg, count] of sorted) {
    console.log(`\n[${count}x] ${msg.substring(0, 500)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
