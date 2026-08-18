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

export function saveRecords(newRecords: BaccaratRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify([...getRecords(), ...newRecords]));
}

export function clearRecords(): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify([]));
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

export function setMasters(masters: BaccaratMasters): void {
  localStorage.setItem(MASTERS_KEY, JSON.stringify(masters));
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
  startSum: number;
  endSum: number;
  storeProfit: number; // 店の収支 = endSum - startSum
  holdRate: number | null;
}

function aggregateBy(records: BaccaratRecord[], keysFn: (r: BaccaratRecord) => string[]): AggregateItem[] {
  const map = new Map<string, { count: number; startSum: number; endSum: number }>();
  for (const r of records) {
    for (const k of keysFn(r)) {
      if (!k) continue;
      const e = map.get(k) ?? { count: 0, startSum: 0, endSum: 0 };
      e.count += 1;
      e.startSum += r.startAmount;
      e.endSum += r.endAmount;
      map.set(k, e);
    }
  }
  return Array.from(map.entries()).map(([label, e]) => {
    const storeProfit = e.endSum - e.startSum;
    return {
      label, count: e.count, startSum: e.startSum, endSum: e.endSum, storeProfit,
      holdRate: e.startSum > 0 ? storeProfit / e.startSum : null,
    };
  }).sort((a, b) => b.storeProfit - a.storeProfit);
}

export function getDealerSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.dealerIds);
}

export function getShuffleSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => [r.shuffle]);
}

export function getCustomerSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.customerIds ?? []);
}

export interface OverallSummary {
  count: number;
  startSum: number;
  endSum: number;
  storeProfit: number;
  holdRate: number | null;
}

export function getOverallSummary(): OverallSummary {
  const records = getRecords();
  const startSum = records.reduce((s, r) => s + r.startAmount, 0);
  const endSum = records.reduce((s, r) => s + r.endAmount, 0);
  const storeProfit = endSum - startSum;
  return { count: records.length, startSum, endSum, storeProfit, holdRate: startSum > 0 ? storeProfit / startSum : null };
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
