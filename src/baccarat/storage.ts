import type { BaccaratRecord, BaccaratMasters, MasterKind } from './types';
import { DEFAULT_MASTERS } from './types';

const RECORDS_KEY = 'baccarat_records';
const MASTERS_KEY = 'baccarat_masters';

// ── Records ──────────────────────────────────────────────────
export function getRecords(): BaccaratRecord[] {
  try {
    const d = localStorage.getItem(RECORDS_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveRecord(record: BaccaratRecord): void {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(getRecords().filter(r => r.id !== id)));
}

export function updateRecordMemo(id: string, memo: string): void {
  const records = getRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return;
  records[idx] = { ...records[idx], memo: memo.trim() || undefined };
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// ── Masters ──────────────────────────────────────────────────
export function getMasters(): BaccaratMasters {
  try {
    const d = localStorage.getItem(MASTERS_KEY);
    return d ? { ...DEFAULT_MASTERS, ...JSON.parse(d) } : { ...DEFAULT_MASTERS };
  } catch { return { ...DEFAULT_MASTERS }; }
}

export function addMasterItem(kind: MasterKind, value: string): void {
  const v = value.trim();
  if (!v) return;
  const masters = getMasters();
  if (masters[kind].includes(v)) return;
  masters[kind] = [...masters[kind], v];
  localStorage.setItem(MASTERS_KEY, JSON.stringify(masters));
}

export function removeMasterItem(kind: MasterKind, value: string): void {
  const masters = getMasters();
  masters[kind] = masters[kind].filter(v => v !== value);
  localStorage.setItem(MASTERS_KEY, JSON.stringify(masters));
}

// ── ID ───────────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Aggregations (単一次元のみ。客×ディーラー等の掛け合わせは行わない) ──
export interface AggregateItem {
  label: string;
  count: number;
  inSum: number;
  outSum: number;
  storeProfit: number; // 店の収支 = -( outSum - inSum )
  holdRate: number | null;
}

function aggregateBy(records: BaccaratRecord[], keyFn: (r: BaccaratRecord) => string | undefined): AggregateItem[] {
  const map = new Map<string, { count: number; inSum: number; outSum: number }>();
  for (const r of records) {
    const k = keyFn(r);
    if (!k) continue;
    const e = map.get(k) ?? { count: 0, inSum: 0, outSum: 0 };
    e.count += 1;
    e.inSum += r.inAmount;
    e.outSum += r.outAmount;
    map.set(k, e);
  }
  return Array.from(map.entries()).map(([label, e]) => {
    const storeProfit = e.inSum - e.outSum;
    return {
      label, count: e.count, inSum: e.inSum, outSum: e.outSum, storeProfit,
      holdRate: e.inSum > 0 ? storeProfit / e.inSum : null,
    };
  }).sort((a, b) => b.storeProfit - a.storeProfit);
}

export function getDealerSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.dealer);
}

export function getShuffleSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.shuffle);
}

export function getCustomerSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.customerId);
}

export interface OverallSummary {
  count: number;
  inSum: number;
  outSum: number;
  storeProfit: number;
  holdRate: number | null;
}

export function getOverallSummary(): OverallSummary {
  const records = getRecords();
  const inSum = records.reduce((s, r) => s + r.inAmount, 0);
  const outSum = records.reduce((s, r) => s + r.outAmount, 0);
  const storeProfit = inSum - outSum;
  return { count: records.length, inSum, outSum, storeProfit, holdRate: inSum > 0 ? storeProfit / inSum : null };
}

export function formatYen(n: number): string {
  const abs = Math.abs(Math.round(n));
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    return rem === 0 ? `${sign}${man}万` : `${sign}${man}万${rem.toLocaleString()}`;
  }
  return `${sign}${abs.toLocaleString()}`;
}
