/**
 * One-time migration: Add reference (AP + 8 digits) to existing quotes that don't have one.
 * Run: node scripts/backfill-quote-references.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

function generateRef() {
  return `AP${Math.floor(10000000 + Math.random() * 90000000)}`;
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apex-cleaning';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const quotes = db.collection('quotes');

  const withoutRef = await quotes.find({ $or: [{ reference: { $exists: false } }, { reference: null }, { reference: '' }] }).toArray();
  console.log(`Found ${withoutRef.length} quotes without reference`);

  let updated = 0;
  const used = new Set();
  for (const q of withoutRef) {
    let ref;
    for (let i = 0; i < 10; i++) {
      ref = generateRef();
      const existing = await quotes.findOne({ reference: ref });
      if (!existing && !used.has(ref)) break;
    }
    await quotes.updateOne({ _id: q._id }, { $set: { reference: ref } });
    used.add(ref);
    updated++;
    if (updated % 10 === 0) console.log(`Updated ${updated}/${withoutRef.length}`);
  }
  console.log(`Done. Updated ${updated} quotes.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
