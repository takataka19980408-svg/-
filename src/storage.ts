import type { Expense, Store, ExpenseCategory, AppSettings } from './types';
import { CATEGORY_LABELS, CATEGORY_ORDER, DEFAULT_SETTINGS } from './types';

const RECORDS_KEY  = 'kakeibo_expenses';
const STORES_KEY   = 'kakeibo_stores';
const SETTINGS_KEY = 'kakeibo_settings';

// ── Expenses ─────────────────────────────────────────────────
export function getExpenses(): Expense[] {
  try {
    const d = localStorage.getItem(RECORDS_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  expenses.push(expense);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(expenses));
}

export function updateExpense(id: string, patch: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx === -1) return;
  expenses[idx] = { ...expenses[idx], ...patch };
  localStorage.setItem(RECORDS_KEY, JSON.stringify(expenses));
}

export function deleteExpense(id: string): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(getExpenses().filter(e => e.id !== id)));
}

// ── Stores ───────────────────────────────────────────────────
export function getStores(): Store[] {
  try {
    const d = localStorage.getItem(STORES_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

export function findStoreByName(name: string): Store | undefined {
  return getStores().find(s => s.name === name.trim());
}

export function upsertStore(store: Store): void {
  const stores = getStores();
  const idx = stores.findIndex(s => s.id === store.id);
  if (idx === -1) stores.push(store);
  else stores[idx] = store;
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

export function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Basic aggregations ───────────────────────────────────────
export function getTotalSpending(): number {
  return getExpenses().reduce((s, e) => s + e.amount, 0);
}

export function getMonthSpending(year?: number, month?: number): number {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  return getExpenses().filter(e => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
}

export function getExpensesForMonth(year: number, month: number): Expense[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return getExpenses().filter(e => e.date.startsWith(prefix));
}

// ── Ranking ──────────────────────────────────────────────────
export interface RankingItem {
  label: string;
  amount: number;
  count: number;
}

function buildRanking(expenses: Expense[], keyFn: (e: Expense) => string): RankingItem[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const k = keyFn(e);
    const entry = map.get(k) ?? { amount: 0, count: 0 };
    map.set(k, { amount: entry.amount + e.amount, count: entry.count + 1 });
  }
  return Array.from(map.entries())
    .map(([label, d]) => ({ label, ...d }))
    .sort((a, b) => b.amount - a.amount);
}

export function getStoreRanking(expenses: Expense[] = getExpenses()): RankingItem[] {
  return buildRanking(expenses, e => e.storeName);
}

export function getCompanyRanking(expenses: Expense[] = getExpenses()): RankingItem[] {
  return buildRanking(expenses, e => e.company || e.storeName);
}

export function getCategoryRanking(expenses: Expense[] = getExpenses()): RankingItem[] {
  return buildRanking(expenses, e => CATEGORY_LABELS[e.category] ?? e.category);
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  amount: number;
  count: number;
}

export function getCategoryBreakdown(expenses: Expense[]): CategoryBreakdownItem[] {
  const map = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const e of expenses) {
    const entry = map.get(e.category) ?? { amount: 0, count: 0 };
    map.set(e.category, { amount: entry.amount + e.amount, count: entry.count + 1 });
  }
  return CATEGORY_ORDER
    .map(category => ({ category, ...(map.get(category) ?? { amount: 0, count: 0 }) }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.amount - a.amount);
}

// ── Monthly trend (for line/bar chart) ──────────────────────
export interface MonthPoint {
  year: number;
  month: number;
  label: string;
  amount: number;
}

export function getMonthlyTrend(monthsBack: number): MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    points.push({ year: y, month: m, label: `${m}月`, amount: getMonthSpending(y, m) });
  }
  return points;
}

export interface DayData {
  day: number;
  amount: number;
  count: number;
}

export function getDailyDataForMonth(year: number, month: number): DayData[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const expenses = getExpensesForMonth(year, month);
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const recs = expenses.filter(e => e.date === dateStr);
    return {
      day,
      amount: recs.reduce((s, e) => s + e.amount, 0),
      count: recs.length,
    };
  });
}

// ── CSV export / import ──────────────────────────────────────
export function exportCSV(): void {
  const expenses = getExpenses().slice().sort((a, b) => a.date.localeCompare(b.date));
  const header = '日付,店舗名,企業,カテゴリ,金額,メモ';
  const rows = expenses.map(e =>
    [e.date, e.storeName, e.company, CATEGORY_LABELS[e.category] ?? e.category, e.amount, e.memo ?? '']
      .map(csvEscape).join(','),
  );
  triggerDownload('﻿' + [header, ...rows].join('\r\n'), `kakeibo_${todayStr()}.csv`, 'text/csv;charset=utf-8;');
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Backup / Restore ─────────────────────────────────────────
export function getBackupJson(): { json: string; filename: string } {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses: getExpenses(),
    stores: getStores(),
    settings: getSettings(),
  };
  return { json: JSON.stringify(data, null, 2), filename: `kakeibo_backup_${todayStr()}.json` };
}

export function exportBackup(): void {
  const { json, filename } = getBackupJson();
  triggerDownload(json, filename, 'application/json');
}

export function restoreBackup(json: string): void {
  const data = JSON.parse(json);
  if (!Array.isArray(data.expenses)) throw new Error('invalid backup');
  localStorage.setItem(RECORDS_KEY, JSON.stringify(data.expenses));
  localStorage.setItem(STORES_KEY, JSON.stringify(data.stores ?? []));
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
}

export function clearAllData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(STORES_KEY);
}

// ── Utilities ────────────────────────────────────────────────
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

export function formatYen(amount: number): string {
  return `¥${Math.round(amount).toLocaleString()}`;
}

export function formatYenCompact(amount: number): string {
  const abs = Math.round(Math.abs(amount));
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    return rem === 0 ? `¥${man}万` : `¥${man}万${rem.toLocaleString()}`;
  }
  return `¥${abs.toLocaleString()}`;
}
