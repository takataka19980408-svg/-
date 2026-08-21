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

export function updateRecord(record: BaccaratRecord): void {
  const records = getRecords();
  const idx = records.findIndex(r => r.id === record.id);
  if (idx === -1) return;
  records[idx] = record;
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

// ── Backup / Restore ────────────────────────────────────────────
export function getBackupJson(): { json: string; filename: string } {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records: getRecords(),
    masters: getMasters(),
  };
  return { json: JSON.stringify(data, null, 2), filename: `baccarat_backup_${today()}.json` };
}

export function exportBackup(): void {
  const { json, filename } = getBackupJson();
  triggerDownload(json, filename, 'application/json');
}

export function restoreBackup(json: string): void {
  const data = JSON.parse(json);
  if (!Array.isArray(data.records)) throw new Error('invalid backup');
  localStorage.setItem(RECORDS_KEY, JSON.stringify(data.records));
  if (data.masters) localStorage.setItem(MASTERS_KEY, JSON.stringify({ ...DEFAULT_MASTERS, ...data.masters }));
}

function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

function aggregateBy(
  records: BaccaratRecord[],
  keysFn: (r: BaccaratRecord) => string[],
  sortFn: (a: AggregateItem, b: AggregateItem) => number = (a, b) => b.storeProfit - a.storeProfit,
): AggregateItem[] {
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
  }).sort(sortFn);
}

export function getDealerSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => r.dealerIds);
}

export function getShuffleSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => [r.shuffle]);
}

// 客が2人以上いる対応は、店収支をそのまま全員に付けると水増しになるため、
// customerProfits（手入力の客ごとの配分）をその客の収支として使う。
// 客が1人以下の対応は従来どおり店収支をそのまま使う。
function aggregateCustomers(records: BaccaratRecord[]): AggregateItem[] {
  const map = new Map<string, { count: number; startSum: number; endSum: number; profitSum: number }>();
  for (const r of records) {
    const ids = r.customerIds ?? [];
    if (ids.length === 0) continue;
    for (const id of ids) {
      const e = map.get(id) ?? { count: 0, startSum: 0, endSum: 0, profitSum: 0 };
      e.count += 1;
      if (ids.length === 1) {
        e.startSum += r.startAmount;
        e.endSum += r.endAmount;
        e.profitSum += r.endAmount - r.startAmount;
      } else {
        e.profitSum += r.customerProfits?.[id] ?? 0;
      }
      map.set(id, e);
    }
  }
  return Array.from(map.entries()).map(([label, e]) => ({
    label, count: e.count, startSum: e.startSum, endSum: e.endSum,
    storeProfit: e.profitSum,
    holdRate: e.startSum > 0 ? e.profitSum / e.startSum : null,
  })).sort((a, b) => b.storeProfit - a.storeProfit);
}

export function getCustomerSummary(): AggregateItem[] {
  return aggregateCustomers(getRecords());
}

// ある対応（記録）における特定の客の収支。客が1人以下ならその対応の店収支
// そのもの、2人以上ならcustomerProfits（手入力の配分）から取得。
export function getCustomerProfitForRecord(r: BaccaratRecord, customerId: string): number {
  const ids = r.customerIds ?? [];
  if (ids.length <= 1) return r.endAmount - r.startAmount;
  return r.customerProfits?.[customerId] ?? 0;
}

// ── 日付ベースの集計（年別／月別／週別／曜日別） ─────────────
function getYearKey(date: string): string {
  return date.slice(0, 4) + '年';
}

function getMonthKey(date: string): string {
  return date.slice(0, 7).replace('-', '年') + '月';
}

export function getDayKey(date: string): string {
  return `${date.slice(0, 4)}年${date.slice(5, 7)}月${date.slice(8, 10)}日`;
}

const WEEKDAY_LABELS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

function getWeekdayKey(date: string): string {
  return WEEKDAY_LABELS[new Date(date + 'T00:00:00').getDay()];
}

export function getYearSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => [getYearKey(r.date)], (a, b) => a.label.localeCompare(b.label));
}

export function getMonthSummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => [getMonthKey(r.date)], (a, b) => a.label.localeCompare(b.label));
}

export function getDaySummary(): AggregateItem[] {
  return aggregateBy(getRecords(), r => [getDayKey(r.date)], (a, b) => b.label.localeCompare(a.label));
}

// ── 年／月／日の期間ごとの個別記録（期間の来店履歴・内訳表用） ──
export function getRecordsForYear(yearKey: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => getYearKey(r.date) === yearKey)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getRecordsForMonth(monthKey: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => getMonthKey(r.date) === monthKey)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function getRecordsForDay(dayKey: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => getDayKey(r.date) === dayKey)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// 特定の記録群（期間で絞り込み済み）内での内訳。ディーラー／シャッフルとは掛け合わせない。
export function getCustomerSummaryForRecords(records: BaccaratRecord[]): AggregateItem[] {
  return aggregateCustomers(records);
}

export function getDealerSummaryForRecords(records: BaccaratRecord[]): AggregateItem[] {
  return aggregateBy(records, r => r.dealerIds);
}

export function getShuffleSummaryForRecords(records: BaccaratRecord[]): AggregateItem[] {
  return aggregateBy(records, r => [r.shuffle]);
}

export function getWeekdaySummaryForRecords(records: BaccaratRecord[]): AggregateItem[] {
  return aggregateBy(records, r => [getWeekdayKey(r.date)],
    (a, b) => WEEKDAY_LABELS.indexOf(a.label) - WEEKDAY_LABELS.indexOf(b.label));
}

// ── 客ごとの個別記録（客のピックアップ表用。単一の客に絞り込んだ生データ） ──
export function getRecordsForCustomer(customerId: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => (r.customerIds ?? []).includes(customerId))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// ── ディーラーごとの個別記録（ディーラー別画面用。単一のディーラーに絞り込んだ生データ） ──
export function getRecordsForDealer(dealerId: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => r.dealerIds.includes(dealerId))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export interface OverallSummary {
  count: number;
  startSum: number;
  endSum: number;
  storeProfit: number;
  holdRate: number | null;
}

export function getRecordsForThisMonth(): BaccaratRecord[] {
  const monthLabel = getMonthKey(today());
  return getRecords().filter(r => getMonthKey(r.date) === monthLabel);
}

export function getOverallSummary(): OverallSummary {
  const records = getRecords();
  const startSum = records.reduce((s, r) => s + r.startAmount, 0);
  const endSum = records.reduce((s, r) => s + r.endAmount, 0);
  const storeProfit = endSum - startSum;
  return { count: records.length, startSum, endSum, storeProfit, holdRate: startSum > 0 ? storeProfit / startSum : null };
}

export interface MonthSummary extends OverallSummary {
  monthLabel: string;
}

export function getThisMonthSummary(): MonthSummary {
  const monthLabel = getMonthKey(today());
  const records = getRecordsForThisMonth();
  const startSum = records.reduce((s, r) => s + r.startAmount, 0);
  const endSum = records.reduce((s, r) => s + r.endAmount, 0);
  const storeProfit = endSum - startSum;
  return {
    monthLabel, count: records.length, startSum, endSum, storeProfit,
    holdRate: startSum > 0 ? storeProfit / startSum : null,
  };
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
