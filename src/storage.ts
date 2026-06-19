import type { GamblingRecord, Store, GamblingCategory, AppSettings } from './types';
import { CATEGORY_LABELS, WEEKDAY_LABELS, DEFAULT_SETTINGS } from './types';

const RECORDS_KEY = 'zenicho_records';
const STORES_KEY = 'zenicho_stores';
const SETTINGS_KEY = 'zenicho_settings';

// ── Records ──────────────────────────────────────────────────
export function getRecords(): GamblingRecord[] {
  try {
    const d = localStorage.getItem(RECORDS_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveRecord(record: GamblingRecord): void {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(getRecords().filter(r => r.id !== id)));
}

// ── Stores ───────────────────────────────────────────────────
export function getStores(): Store[] {
  try {
    const d = localStorage.getItem(STORES_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveStore(store: Store): void {
  const stores = getStores();
  stores.push(store);
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export function deleteStore(id: string): void {
  localStorage.setItem(STORES_KEY, JSON.stringify(getStores().filter(s => s.id !== id)));
}

// ── Settings ─────────────────────────────────────────────────
export function getSettings(): AppSettings {
  try {
    const d = localStorage.getItem(SETTINGS_KEY);
    return d ? { ...DEFAULT_SETTINGS, ...JSON.parse(d) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ── ID ───────────────────────────────────────────────────────
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Effective date (respects day boundary) ───────────────────
export function getEffectiveToday(boundaryHour: number): string {
  const now = new Date();
  if (now.getHours() < boundaryHour) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
}

// ── Basic aggregations ───────────────────────────────────────
export function getTotalProfit(): number {
  return getRecords().reduce((s, r) => s + r.profit, 0);
}

export function getTodayProfit(): number {
  const today = new Date().toISOString().split('T')[0];
  return getRecords().filter(r => r.date === today).reduce((s, r) => s + r.profit, 0);
}

export function getMonthProfit(year?: number, month?: number): number {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  return getRecords().filter(r => r.date.startsWith(prefix)).reduce((s, r) => s + r.profit, 0);
}

// ── Ranking items ────────────────────────────────────────────
export interface RankingItem {
  label: string;
  profit: number;
  count: number;
}

function buildRanking(
  records: GamblingRecord[],
  keyFn: (r: GamblingRecord) => string,
): RankingItem[] {
  const map = new Map<string, { profit: number; count: number }>();
  for (const r of records) {
    const k = keyFn(r);
    const e = map.get(k) ?? { profit: 0, count: 0 };
    map.set(k, { profit: e.profit + r.profit, count: e.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, d]) => ({ label, ...d }))
    .sort((a, b) => b.profit - a.profit);
}

export function getStoreRanking(): RankingItem[] {
  return buildRanking(getRecords(), r => r.storeName);
}

export function getCategoryRanking(): RankingItem[] {
  return buildRanking(getRecords(), r => CATEGORY_LABELS[r.category as GamblingCategory] ?? r.category);
}

export function getWeekdayRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<number, { profit: number; count: number }>();
  for (const r of records) {
    const day = new Date(r.date).getDay();
    const e = map.get(day) ?? { profit: 0, count: 0 };
    map.set(day, { profit: e.profit + r.profit, count: e.count + 1 });
  }
  return WEEKDAY_LABELS.map((label, i) => ({
    label: `${label}曜日`,
    profit: map.get(i)?.profit ?? 0,
    count: map.get(i)?.count ?? 0,
  })).sort((a, b) => b.profit - a.profit);
}

export function getMonthRanking(): RankingItem[] {
  return buildRanking(getRecords(), r => {
    const [y, m] = r.date.split('-');
    return `${y}年${parseInt(m)}月`;
  });
}

export function getYearRanking(): RankingItem[] {
  return buildRanking(getRecords(), r => `${r.date.split('-')[0]}年`);
}

export function getStoreCategoryRanking(): RankingItem[] {
  return buildRanking(
    getRecords(),
    r => `${r.storeName}／${CATEGORY_LABELS[r.category as GamblingCategory] ?? r.category}`,
  );
}

// ── Analysis ─────────────────────────────────────────────────
export interface DayData {
  day: number;
  profit: number;
  inSum: number;
  outSum: number;
  count: number;
}

export function getDailyDataForMonth(year: number, month: number): DayData[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = getRecords().filter(r => r.date.startsWith(prefix));
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${prefix}-${String(day).padStart(2, '0')}`;
    const recs = records.filter(r => r.date === dateStr);
    return {
      day,
      profit: recs.reduce((s, r) => s + r.profit, 0),
      inSum: recs.reduce((s, r) => s + r.inAmount, 0),
      outSum: recs.reduce((s, r) => s + r.outAmount, 0),
      count: recs.length,
    };
  });
}

export interface MonthSummary {
  winDays: number;
  lossDays: number;
  evenDays: number;
  totalIn: number;
  totalOut: number;
  recoveryRate: number | null;
}

export function getMonthSummary(year: number, month: number): MonthSummary {
  const daily = getDailyDataForMonth(year, month).filter(d => d.count > 0);
  const totalIn = daily.reduce((s, d) => s + d.inSum, 0);
  const totalOut = daily.reduce((s, d) => s + d.outSum, 0);
  return {
    winDays: daily.filter(d => d.profit > 0).length,
    lossDays: daily.filter(d => d.profit < 0).length,
    evenDays: daily.filter(d => d.profit === 0).length,
    totalIn,
    totalOut,
    recoveryRate: totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : null,
  };
}

// ── Home helpers ─────────────────────────────────────────────
export function getTopBattlefieldThisMonth(): { label: string; profit: number } | null {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const records = getRecords().filter(r => r.date.startsWith(prefix));
  const map = new Map<string, number>();
  for (const r of records) {
    const key = `${r.storeName}×${CATEGORY_LABELS[r.category as GamblingCategory]}`;
    map.set(key, (map.get(key) ?? 0) + r.profit);
  }
  if (map.size === 0) return null;
  let best = { label: '', profit: -Infinity };
  for (const [label, profit] of map.entries()) {
    if (profit > best.profit) best = { label, profit };
  }
  return best;
}

export function getMonthStoreRanking(year: number, month: number): RankingItem[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return buildRanking(getRecords().filter(r => r.date.startsWith(prefix)), r => r.storeName).slice(0, 5);
}

// ── CSV export / import ──────────────────────────────────────
const CATEGORY_FROM_LABEL: Record<string, GamblingCategory> = {
  'パチンコ': 'pachinko', 'スロット': 'slot', 'バカラ': 'baccarat',
  '競馬': 'horse', '競艇': 'boat', '競輪': 'cycle', '麻雀': 'mahjong', 'その他': 'other',
};

export function exportCSV(): void {
  const records = getRecords();
  const header = '日付,時刻,店舗名,種目,IN,OUT,収支,メモ';
  const rows = records.map(r =>
    [r.date, r.time ?? '', r.storeName,
      CATEGORY_LABELS[r.category as GamblingCategory] ?? r.category,
      r.inAmount, r.outAmount, r.profit, r.memo ?? '',
    ].join(',')
  );
  triggerDownload('﻿' + [header, ...rows].join('\r\n'), `zenicho_${today()}.csv`, 'text/csv;charset=utf-8;');
}

export function importCSV(text: string): { added: number; errors: number } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { added: 0, errors: 0 };
  const existing = getRecords();
  const stores = getStores();
  let added = 0, errors = 0;
  for (const line of lines.slice(1)) {
    try {
      const cols = line.split(',');
      const [date, time, storeName, catLabel, inStr, outStr, , memo] = cols;
      const inAmount = parseInt(inStr) || 0;
      const outAmount = parseInt(outStr) || 0;
      const category: GamblingCategory = CATEGORY_FROM_LABEL[catLabel.trim()] ?? 'other';
      let store = stores.find(s => s.name === storeName.trim());
      if (!store) {
        store = { id: generateId(), name: storeName.trim(), createdAt: new Date().toISOString() };
        saveStore(store);
        stores.push(store);
      }
      const record: GamblingRecord = {
        id: generateId(), date: date.trim(), time: time?.trim() || undefined,
        storeId: store.id, storeName: store.name, category,
        inAmount, outAmount, profit: outAmount - inAmount,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      existing.push(record);
      added++;
    } catch { errors++; }
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(existing));
  return { added, errors };
}

// ── Backup / Restore ─────────────────────────────────────────
export function exportBackup(): void {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records: getRecords(),
    stores: getStores(),
    settings: getSettings(),
  };
  triggerDownload(JSON.stringify(data, null, 2), `zenicho_backup_${today()}.json`, 'application/json');
}

export function restoreBackup(json: string): void {
  const data = JSON.parse(json);
  if (!Array.isArray(data.records)) throw new Error('invalid backup');
  localStorage.setItem(RECORDS_KEY, JSON.stringify(data.records));
  localStorage.setItem(STORES_KEY, JSON.stringify(data.stores ?? []));
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
}

// ── Utilities ────────────────────────────────────────────────
function today(): string {
  return new Date().toISOString().split('T')[0];
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

export function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  if (abs === 0) return '±0';
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    if (rem === 0) return `${sign}${man}万`;
    return `${sign}${man}万${rem.toLocaleString()}`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

export function formatAmountFull(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  if (abs === 0) return '±0円';
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    if (rem === 0) return `${sign}${man.toLocaleString()}万円`;
    return `${sign}${man.toLocaleString()}万${rem.toLocaleString()}円`;
  }
  return `${sign}${abs.toLocaleString()}円`;
}
