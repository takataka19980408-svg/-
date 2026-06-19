import type { GamblingRecord, Store, GamblingCategory } from './types';
import { CATEGORY_LABELS, WEEKDAY_LABELS } from './types';

const RECORDS_KEY = 'zenicho_records';
const STORES_KEY = 'zenicho_stores';

export function getRecords(): GamblingRecord[] {
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: GamblingRecord): void {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  const records = getRecords().filter(r => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getStores(): Store[] {
  try {
    const data = localStorage.getItem(STORES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStore(store: Store): void {
  const stores = getStores();
  stores.push(store);
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export function deleteStore(id: string): void {
  const stores = getStores().filter(s => s.id !== id);
  localStorage.setItem(STORES_KEY, JSON.stringify(stores));
}

export function getTodayProfit(): number {
  const today = new Date().toISOString().split('T')[0];
  return getRecords()
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + r.profit, 0);
}

export function getMonthProfit(): number {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return getRecords()
    .filter(r => r.date.startsWith(month))
    .reduce((sum, r) => sum + r.profit, 0);
}

export function getTotalProfit(): number {
  return getRecords().reduce((sum, r) => sum + r.profit, 0);
}

export interface RankingItem {
  label: string;
  profit: number;
  count: number;
}

export function getStoreRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<string, { profit: number; count: number }>();
  for (const r of records) {
    const existing = map.get(r.storeName) || { profit: 0, count: 0 };
    map.set(r.storeName, { profit: existing.profit + r.profit, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.profit - a.profit);
}

export function getCategoryRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<string, { profit: number; count: number }>();
  for (const r of records) {
    const label = CATEGORY_LABELS[r.category as GamblingCategory] || r.category;
    const existing = map.get(label) || { profit: 0, count: 0 };
    map.set(label, { profit: existing.profit + r.profit, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.profit - a.profit);
}

export function getWeekdayRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<number, { profit: number; count: number }>();
  for (const r of records) {
    const day = new Date(r.date).getDay();
    const existing = map.get(day) || { profit: 0, count: 0 };
    map.set(day, { profit: existing.profit + r.profit, count: existing.count + 1 });
  }
  return WEEKDAY_LABELS.map((label, i) => ({
    label: `${label}曜日`,
    profit: map.get(i)?.profit ?? 0,
    count: map.get(i)?.count ?? 0,
  })).sort((a, b) => b.profit - a.profit);
}

export function getMonthRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<string, { profit: number; count: number }>();
  for (const r of records) {
    const [year, month] = r.date.split('-');
    const label = `${year}年${parseInt(month)}月`;
    const existing = map.get(label) || { profit: 0, count: 0 };
    map.set(label, { profit: existing.profit + r.profit, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.profit - a.profit);
}

export function getYearRanking(): RankingItem[] {
  const records = getRecords();
  const map = new Map<string, { profit: number; count: number }>();
  for (const r of records) {
    const year = r.date.split('-')[0];
    const label = `${year}年`;
    const existing = map.get(label) || { profit: 0, count: 0 };
    map.set(label, { profit: existing.profit + r.profit, count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, data]) => ({ label, ...data }))
    .sort((a, b) => b.profit - a.profit);
}

export function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const sen = abs % 10000;
    if (sen === 0) return (amount < 0 ? '-' : '') + `${man}万`;
    return (amount < 0 ? '-' : '') + `${man}万${sen.toLocaleString()}`;
  }
  return abs.toLocaleString() + (amount < 0 ? '' : '');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
