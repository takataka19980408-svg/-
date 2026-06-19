import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const STORES = [
  { id: randomUUID(), name: 'ガイア新宿店',         createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: 'マルハン渋谷店',        createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: 'スーパーD\'ステーション池袋', createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: 'ニラク横浜店',          createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: '楽園浅草店',            createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: 'ラウンドワン品川店',     createdAt: '2023-01-01T00:00:00.000Z' },
  { id: randomUUID(), name: 'パーラーフジ吉祥寺',    createdAt: '2023-01-01T00:00:00.000Z' },
];

const CATEGORIES = [
  { key: 'pachinko', label: 'パチンコ', weight: 30 },
  { key: 'slot',     label: 'スロット', weight: 30 },
  { key: 'horse',    label: '競馬',     weight: 15 },
  { key: 'baccarat', label: 'バカラ',   weight: 8  },
  { key: 'boat',     label: '競艇',     weight: 7  },
  { key: 'mahjong',  label: '麻雀',     weight: 6  },
  { key: 'cycle',    label: '競輪',     weight: 3  },
  { key: 'other',    label: 'その他',   weight: 1  },
];

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function round500(n) { return Math.round(n / 500) * 500; }
function round1000(n) { return Math.round(n / 1000) * 1000; }

function genAmounts(catKey) {
  switch (catKey) {
    case 'pachinko':
    case 'slot': {
      const inAmt = round500(randInt(1000, 30000));
      const sessions = Math.ceil(inAmt / 2000);
      const winBias = Math.random();
      let outAmt;
      if (winBias > 0.62) {
        outAmt = round500(inAmt + randInt(1000, 50000));
      } else if (winBias > 0.25) {
        outAmt = round500(randInt(0, inAmt - 500));
      } else {
        outAmt = 0;
      }
      return { inAmt, outAmt, sessions };
    }
    case 'horse':
    case 'boat':
    case 'cycle': {
      const inAmt = round1000(randInt(1000, 20000));
      const winBias = Math.random();
      let outAmt;
      if (winBias > 0.55) {
        outAmt = round1000(inAmt + randInt(500, 60000));
      } else {
        outAmt = 0;
      }
      return { inAmt, outAmt };
    }
    case 'baccarat': {
      const inAmt = round1000(randInt(5000, 100000));
      const winBias = Math.random();
      let outAmt;
      if (winBias > 0.48) {
        outAmt = round1000(inAmt + randInt(1000, 80000));
      } else {
        outAmt = Math.max(0, round1000(inAmt - randInt(1000, inAmt)));
      }
      return { inAmt, outAmt };
    }
    case 'mahjong': {
      const inAmt = round1000(randInt(1000, 20000));
      const winBias = Math.random();
      let outAmt;
      if (winBias > 0.5) {
        outAmt = round1000(inAmt + randInt(500, 30000));
      } else {
        outAmt = Math.max(0, round1000(inAmt - randInt(500, inAmt)));
      }
      return { inAmt, outAmt };
    }
    default: {
      const inAmt = round1000(randInt(1000, 10000));
      return { inAmt, outAmt: round1000(randInt(0, inAmt * 2)) };
    }
  }
}

// Generate dates spanning 2 years back from today (2026-06-19)
const TODAY = new Date('2026-06-19');
const START = new Date('2024-06-19');
const RANGE_MS = TODAY - START;

const usedDates = new Set();
const records = [];

// 300 records, but clump them into ~100 "session days" (2-4 records per day)
let generated = 0;
let attempt = 0;

while (generated < 300 && attempt < 5000) {
  attempt++;
  const offset = Math.floor(Math.random() * RANGE_MS);
  const d = new Date(START.getTime() + offset);
  const dateStr = d.toISOString().slice(0, 10);

  const dayCount = records.filter(r => r.date === dateStr).length;
  if (dayCount >= 3) continue;

  const store = STORES[randInt(0, STORES.length - 1)];
  const cat = pickWeighted(CATEGORIES);
  const { inAmt, outAmt } = genAmounts(cat.key);

  const hour = randInt(10, 22);
  const min = randInt(0, 59);
  const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

  records.push({
    id: randomUUID(),
    date: dateStr,
    time: timeStr,
    storeId: store.id,
    storeName: store.name,
    category: cat.key,
    inAmount: inAmt,
    outAmount: outAmt,
    profit: outAmt - inAmt,
    createdAt: `${dateStr}T${timeStr}:00.000Z`,
  });
  generated++;
}

records.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

const backup = {
  version: 1,
  exportedAt: TODAY.toISOString(),
  records,
  stores: STORES,
  settings: { dayBoundaryHour: 6 },
};

const outPath = './public/seed_data.json';
writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf-8');

// Stats summary
const totalProfit = records.reduce((s, r) => s + r.profit, 0);
const wins = records.filter(r => r.profit > 0).length;
const losses = records.filter(r => r.profit < 0).length;
const totalIn = records.reduce((s, r) => s + r.inAmount, 0);
const totalOut = records.reduce((s, r) => s + r.outAmount, 0);

console.log(`✅ Generated ${records.length} records`);
console.log(`   期間: ${records[0].date} 〜 ${records[records.length-1].date}`);
console.log(`   勝ち: ${wins}件 / 負け: ${losses}件`);
console.log(`   総投資: ¥${totalIn.toLocaleString()} / 総回収: ¥${totalOut.toLocaleString()}`);
console.log(`   生涯収支: ${totalProfit >= 0 ? '+' : ''}¥${totalProfit.toLocaleString()}`);
console.log(`   保存先: ${outPath}`);
