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
// 数字は1,2,3…の数値順、アルファベットはa,b,c…の順で並ぶ自然順ソート。
const masterCollator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });

function sortMasterList(values: string[]): string[] {
  return values.slice().sort(masterCollator.compare);
}

export function getMasters(): BaccaratMasters {
  try {
    const d = localStorage.getItem(MASTERS_KEY);
    const raw: BaccaratMasters = d ? { ...DEFAULT_MASTERS, ...JSON.parse(d) } : { ...DEFAULT_MASTERS };
    return {
      dealers: sortMasterList(raw.dealers),
      shuffles: sortMasterList(raw.shuffles),
      tables: sortMasterList(raw.tables),
      customers: sortMasterList(raw.customers),
    };
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

// 営業日は「正午」に切り替わる（深夜〜正午前の記録は前日扱い）。
export function today(): string {
  const shifted = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Aggregations (単一次元のみ。客×ディーラー等の掛け合わせは行わない) ──
export interface AggregateItem {
  label: string;
  count: number;
  startSum: number;
  endSum: number;
  storeProfit: number; // 店の収支 = endSum - startSum
  holdRate: number | null;
  // 該当する記録に登場した客ID（重複なし）の人数。年別/月別/日別/曜日別のような
  // 期間集計でのみ意味を持つため、それ以外（客別など）では未設定。
  customerCount?: number;
}

function aggregateBy(
  records: BaccaratRecord[],
  keysFn: (r: BaccaratRecord) => string[],
  sortFn: (a: AggregateItem, b: AggregateItem) => number = (a, b) => b.storeProfit - a.storeProfit,
): AggregateItem[] {
  const map = new Map<string, { count: number; startSum: number; endSum: number; customers: Set<string> }>();
  for (const r of records) {
    const keys = keysFn(r).filter(k => k);
    if (keys.length === 0) continue;
    // 1つの記録に複数キーが該当する場合（ディーラー2人選択時など）は、
    // 収支（プラスもマイナスも）を人数で均等に按分する（重複計上を防ぐ）。
    // 対応回数はそれぞれ1回分としてそのままカウントする。
    const share = 1 / keys.length;
    for (const k of keys) {
      const e = map.get(k) ?? { count: 0, startSum: 0, endSum: 0, customers: new Set<string>() };
      e.count += 1;
      e.startSum += r.startAmount * share;
      e.endSum += r.endAmount * share;
      for (const id of r.customerIds ?? []) e.customers.add(id);
      map.set(k, e);
    }
  }
  return Array.from(map.entries()).map(([label, e]) => {
    const storeProfit = e.endSum - e.startSum;
    return {
      label, count: e.count, startSum: e.startSum, endSum: e.endSum, storeProfit,
      holdRate: e.startSum > 0 ? storeProfit / e.startSum : null,
      customerCount: e.customers.size,
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

// ある対応（記録）における1人あたりのディーラー収支。ディーラーが2人以上
// 選択されている場合は店収支（プラスもマイナスも）を人数で均等按分する。
export function getDealerProfitForRecord(r: BaccaratRecord): number {
  return (r.endAmount - r.startAmount) / r.dealerIds.length;
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

// シュート単位の履歴カードに添える短い日付表示（例: 8/11）。
export function getShortDayKey(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}

// 各種の来店履歴・対応履歴一覧を日別に区切って表示するための共通処理。
// 日付降順（直近が先頭）、各日の中はcreatedAt昇順（入力順＝1シュート目から）で並べる。
export interface DayGroup {
  date: string;
  label: string;
  records: BaccaratRecord[];
}

export function groupRecordsByDay(records: BaccaratRecord[]): DayGroup[] {
  const map = new Map<string, BaccaratRecord[]>();
  for (const r of records) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, recs]) => ({
      date,
      label: getDayKey(date),
      records: recs.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
}

// 記録IDから「その日の何シュート目か」を引けるようにする。客別・ディーラー別
// などで絞り込んだ一覧でも、履歴画面と同じシュート番号で表示するために使う。
export function getShootNumbers(): Map<string, number> {
  const map = new Map<string, number>();
  for (const group of groupRecordsByDay(getRecords())) {
    group.records.forEach((r, i) => map.set(r.id, i + 1));
  }
  return map;
}

// 記録群に登場する客ID（重複なし）の人数。3シュート遊んだ客も1人と数える。
export function getUniqueCustomerCount(records: BaccaratRecord[]): number {
  const set = new Set<string>();
  for (const r of records) {
    for (const id of r.customerIds ?? []) set.add(id);
  }
  return set.size;
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

// その日（date）の記録をシュートの並び順（createdAt昇順）で取得する。
export function getRecordsForDateSorted(date: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => r.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// その日の最後（createdAtが最新）の記録のエンド額。同じ日は前のシュートの
// エンドが次のシュートのスタートに繋がるため、入力画面の初期値に使う。
export function getLastEndAmountForDate(date: string): number | null {
  const dayRecords = getRecordsForDateSorted(date);
  if (dayRecords.length === 0) return null;
  return dayRecords[dayRecords.length - 1].endAmount;
}

// 指定した記録（anchorId）より後（同じ日でcreatedAtが後）の記録のスタート額を、
// 直前の記録のエンド額に合わせて連鎖的に補正する。抜けていたシュートを後から
// 挿入・編集しても、その日のシュートの繋がりが自動で保たれるようにする。
export function reflowDay(date: string, anchorId: string): void {
  const all = getRecords();
  const dayRecords = all
    .filter(r => r.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const anchorIdx = dayRecords.findIndex(r => r.id === anchorId);
  if (anchorIdx === -1) return;
  let changed = false;
  for (let i = anchorIdx + 1; i < dayRecords.length; i++) {
    const prev = dayRecords[i - 1];
    const cur = dayRecords[i];
    if (cur.startAmount !== prev.endAmount) {
      cur.startAmount = prev.endAmount;
      cur.profit = cur.endAmount - cur.startAmount;
      changed = true;
    }
  }
  if (!changed) return;
  const byId = new Map(dayRecords.map(r => [r.id, r]));
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all.map(r => byId.get(r.id) ?? r)));
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

// ディーラー別詳細画面の客別内訳用。このディーラー自身の店収支合計
// （ディーラー人数で按分済み）と一致するよう、客個人の収支
// （getCustomerProfitForRecord）をさらにディーラー人数で按分して集計する。
export function getCustomerSummaryForDealer(records: BaccaratRecord[]): AggregateItem[] {
  const map = new Map<string, { count: number; profitSum: number }>();
  for (const r of records) {
    for (const id of r.customerIds ?? []) {
      const e = map.get(id) ?? { count: 0, profitSum: 0 };
      e.count += 1;
      e.profitSum += getCustomerProfitForRecord(r, id) / r.dealerIds.length;
      map.set(id, e);
    }
  }
  return Array.from(map.entries())
    .map(([label, e]) => ({ label, count: e.count, startSum: 0, endSum: 0, storeProfit: e.profitSum, holdRate: null }))
    .sort((a, b) => b.storeProfit - a.storeProfit);
}

// ディーラー別詳細画面のシャッフル別内訳用。シャッフルは1記録につき常に
// 1つのため重複計上は起きないが、店収支はディーラー人数で按分する。
export function getShuffleSummaryForDealer(records: BaccaratRecord[]): AggregateItem[] {
  const map = new Map<string, { count: number; profitSum: number }>();
  for (const r of records) {
    if (!r.shuffle) continue;
    const e = map.get(r.shuffle) ?? { count: 0, profitSum: 0 };
    e.count += 1;
    e.profitSum += getDealerProfitForRecord(r);
    map.set(r.shuffle, e);
  }
  return Array.from(map.entries())
    .map(([label, e]) => ({ label, count: e.count, startSum: 0, endSum: 0, storeProfit: e.profitSum, holdRate: null }))
    .sort((a, b) => b.storeProfit - a.storeProfit);
}

export function getWeekdaySummaryForRecords(records: BaccaratRecord[]): AggregateItem[] {
  return aggregateBy(records, r => [getWeekdayKey(r.date)],
    (a, b) => WEEKDAY_LABELS.indexOf(a.label) - WEEKDAY_LABELS.indexOf(b.label));
}

// 客別詳細画面のディーラー別／シャッフル別内訳用。店収支ではなく、その客
// 個人の収支（getCustomerProfitForRecordの合計、店から見た符号のまま）で
// 集計する。表示側で符号反転（invert）して使う。
function aggregateByForCustomer(
  records: BaccaratRecord[],
  customerId: string,
  keysFn: (r: BaccaratRecord) => string[],
): AggregateItem[] {
  const map = new Map<string, { count: number; profitSum: number }>();
  for (const r of records) {
    const keys = keysFn(r).filter(k => k);
    if (keys.length === 0) continue;
    // 1つの記録が複数キーに該当する場合（ディーラー2人選択時など）は、
    // 客の収支を人数で均等按分する（重複計上を防ぐ）。
    const profit = getCustomerProfitForRecord(r, customerId) / keys.length;
    for (const k of keys) {
      const e = map.get(k) ?? { count: 0, profitSum: 0 };
      e.count += 1;
      e.profitSum += profit;
      map.set(k, e);
    }
  }
  return Array.from(map.entries())
    .map(([label, e]) => ({ label, count: e.count, startSum: 0, endSum: 0, storeProfit: e.profitSum, holdRate: null }))
    .sort((a, b) => b.storeProfit - a.storeProfit);
}

export function getDealerSummaryForCustomer(records: BaccaratRecord[], customerId: string): AggregateItem[] {
  return aggregateByForCustomer(records, customerId, r => r.dealerIds);
}

export function getShuffleSummaryForCustomer(records: BaccaratRecord[], customerId: string): AggregateItem[] {
  return aggregateByForCustomer(records, customerId, r => [r.shuffle]);
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

// ── シャッフルごとの個別記録（シャッフル別画面用。単一のシャッフル方式に絞り込んだ生データ） ──
export function getRecordsForShuffle(shuffle: string): BaccaratRecord[] {
  return getRecords()
    .filter(r => r.shuffle === shuffle)
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
