import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check current state
  const historyCount = await prisma.importHistory.count();
  const errorCount = await prisma.importHistoryError.count();
  const facilityCount = await prisma.facility.count();
  
  console.log(`Import history records: ${historyCount}`);
  console.log(`Import error records: ${errorCount}`);
  console.log(`Facilities: ${facilityCount}`);
  console.log();
  
  if (errorCount === 0) {
    console.log("No errors to analyze.");
    return;
  }

  // Get all errors grouped by stage and message pattern
  const errors = await prisma.importHistoryError.findMany({
    select: {
      stage: true,
      source: true,
      sourceRow: true,
      message: true,
      rawData: true,
    },
    orderBy: { id: 'asc' },
  });

  // Categorize errors
  const categories = {};
  
  for (const error of errors) {
    const msg = error.message || '';
    const stage = error.stage || '';
    let category = 'UNKNOWN';
    
    // Categorize based on message patterns
    if (msg.includes('Missing one or more required facility fields')) {
      category = 'MISSING_REQUIRED_FIELDS';
    } else if (msg.includes('Unique constraint') || msg.includes('Unique index constraint') || msg.includes('P2002')) {
      category = 'DUPLICATE_REGISTRATION';
    } else if (msg.includes('Unique constraint failed') || msg.includes('unique constraint')) {
      category = 'DUPLICATE_REGISTRATION';
    } else if (msg.includes('Invalid') && msg.includes('county')) {
      category = 'INVALID_COUNTY';
    } else if (msg.includes('KMPDC request failed')) {
      category = 'NETWORK_ERROR';
    } else if (msg.includes('Cannot read') || msg.includes('undefined') || msg.includes('null')) {
      category = 'NULL_REFERENCE';
    } else if (msg.includes('Expected') || msg.includes('invalid')) {
      category = 'VALIDATION_ERROR';
    } else if (msg.includes('too long') || msg.includes('too short')) {
      category = 'LENGTH_ERROR';
    } else if (msg.includes('NaN') || msg.includes('number')) {
      category = 'TYPE_ERROR';
    } else if (stage === 'NORMALIZATION') {
      category = 'NORMALIZATION_ERROR';
    } else if (stage === 'CREATE') {
      category = 'CREATE_ERROR';
    } else if (stage === 'UPDATE') {
      category = 'UPDATE_ERROR';
    } else if (stage === 'IMPORT') {
      category = 'IMPORT_ERROR';
    }
    
    if (!categories[category]) {
      categories[category] = { count: 0, examples: [], messages: new Set(), stages: new Set() };
    }
    categories[category].count++;
    categories[category].stages.add(stage);
    categories[category].messages.add(msg.substring(0, 200));
    if (categories[category].examples.length < 3) {
      categories[category].examples.push({
        source: error.source,
        sourceRow: error.sourceRow,
        message: msg.substring(0, 150),
        rawData: error.rawData,
      });
    }
  }

  // Print report
  console.log('=== IMPORT ERROR CATEGORIES ===\n');
  
  const sorted = Object.entries(categories).sort((a, b) => b[1].count - a[1].count);
  let totalAnalyzed = 0;
  
  for (const [category, data] of sorted) {
    totalAnalyzed += data.count;
    console.log(`${category.padEnd(35)} ${String(data.count).padStart(6)}`);
    console.log(`  Stages: ${[...data.stages].join(', ')}`);
    console.log(`  Sample messages:`);
    for (const msg of data.messages) {
      console.log(`    - "${msg}"`);
    }
    for (const ex of data.examples) {
      if (ex.rawData) {
        const raw = typeof ex.rawData === 'object' ? JSON.stringify(ex.rawData) : String(ex.rawData);
        console.log(`  Example (source=${ex.source}, row=${ex.sourceRow}):`);
        console.log(`    rawData keys: ${Object.keys(ex.rawData || {}).join(', ')}`);
        // Print relevant rawData fields
        if (ex.rawData && typeof ex.rawData === 'object') {
          for (const [k, v] of Object.entries(ex.rawData)) {
            if (v && String(v).trim()) {
              console.log(`      ${k}: ${String(v).substring(0, 100)}`);
            }
          }
        }
      }
    }
    console.log();
  }
  
  console.log(`Total errors analyzed: ${totalAnalyzed}`);
  
  // Now let's do a deeper analysis - look at the NORMALIZATION errors more carefully
  console.log('\n=== DEEP DIVE: NORMALIZATION ERRORS ===\n');
  
  const normalizationErrors = errors.filter(e => e.stage === 'NORMALIZATION');
  console.log(`Total normalization errors: ${normalizationErrors.length}`);
  
  // Check what the rawData looks like for normalization errors
  const subCategories = {};
  for (const err of normalizationErrors) {
    const msg = err.message || '';
    let subCat = msg.substring(0, 100);
    if (!subCategories[subCat]) {
      subCategories[subCat] = { count: 0, examples: [] };
    }
    subCategories[subCat].count++;
    if (subCategories[subCat].examples.length < 2) {
      subCategories[subCat].examples.push(err);
    }
  }
  
  console.log('\nNormalization error sub-categories:');
  for (const [msg, data] of Object.entries(subCategories).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  [${data.count}] ${msg}`);
    for (const ex of data.examples) {
      if (ex.rawData && typeof ex.rawData === 'object') {
        const raw = ex.rawData;
        const relevantFields = {};
        for (const k of Object.keys(raw)) {
          if (String(raw[k]).trim()) {
            relevantFields[k] = String(raw[k]).substring(0, 80);
          }
        }
        console.log(`    Example data: ${JSON.stringify(relevantFields).substring(0, 300)}`);
      }
    }
  }
  
  // Check CREATE errors
  console.log('\n=== DEEP DIVE: CREATE ERRORS ===\n');
  const createErrors = errors.filter(e => e.stage === 'CREATE');
  console.log(`Total create errors: ${createErrors.length}`);
  
  const createSubCats = {};
  for (const err of createErrors) {
    const msg = err.message || '';
    let subCat = msg.substring(0, 150);
    if (!createSubCats[subCat]) {
      createSubCats[subCat] = { count: 0, examples: [] };
    }
    createSubCats[subCat].count++;
    if (createSubCats[subCat].examples.length < 2) {
      createSubCats[subCat].examples.push(err);
    }
  }
  
  console.log('\nCreate error sub-categories:');
  for (const [msg, data] of Object.entries(createSubCats).sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  [${data.count}] ${msg}`);
    for (const ex of data.examples) {
      if (ex.rawData && typeof ex.rawData === 'object') {
        const raw = ex.rawData;
        const relevantFields = {};
        for (const k of Object.keys(raw)) {
          if (String(raw[k]).trim()) {
            relevantFields[k] = String(raw[k]).substring(0, 80);
          }
        }
        console.log(`    Example data: ${JSON.stringify(relevantFields).substring(0, 300)}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
