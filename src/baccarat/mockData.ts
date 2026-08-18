import type { BaccaratRecord, BaccaratMasters } from './types';
import { getMasters, setMasters, saveRecords, generateId } from './storage';

const MOCK_DEALERS = Array.from({ length: 10 }, (_, i) => `ディーラー${String(i + 1).padStart(2, '0')}`);
const MOCK_SHUFFLES = ['手動シャッフル', 'オートシャッフラー', 'プリシャッフルシュー', 'その他'];
const MOCK_TABLES = Array.from({ length: 5 }, (_, i) => `卓${i + 1}`);
const MOCK_CUSTOMERS = Array.from({ length: 30 }, (_, i) => `客${String(i + 1).padStart(3, '0')}`);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSome<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function randomDateWithinDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  return d.toISOString().split('T')[0];
}

function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export function generateMockData(count = 1000): void {
  const masters = getMasters();
  const merged: BaccaratMasters = {
    dealers: Array.from(new Set([...masters.dealers, ...MOCK_DEALERS])),
    shuffles: Array.from(new Set([...masters.shuffles, ...MOCK_SHUFFLES])),
    tables: Array.from(new Set([...masters.tables, ...MOCK_TABLES])),
    customers: Array.from(new Set([...masters.customers, ...MOCK_CUSTOMERS])),
  };
  setMasters(merged);

  const records: BaccaratRecord[] = Array.from({ length: count }, () => {
    const startAmount = roundTo1000(10000 + Math.random() * 990000);
    const swing = roundTo1000((Math.random() - 0.5) * startAmount * 1.2);
    const endAmount = Math.max(0, startAmount + swing);
    return {
      id: generateId(),
      date: randomDateWithinDays(90),
      table: pick(MOCK_TABLES),
      dealerIds: pickSome(MOCK_DEALERS, 1, 2),
      shuffle: pick(MOCK_SHUFFLES),
      customerIds: Math.random() < 0.85 ? pickSome(MOCK_CUSTOMERS, 1, 2) : undefined,
      startAmount,
      endAmount,
      profit: endAmount - startAmount,
      memo: undefined,
      createdAt: new Date().toISOString(),
    };
  });
  saveRecords(records);
}
