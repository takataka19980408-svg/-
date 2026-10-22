import * as XLSX from 'xlsx';
import { CATEGORY_LABELS } from './types';
import {
  getRecords, getStoreRanking, getCategoryRanking, getMonthRanking,
} from './storage';

const YEN_FMT = '#,##0"円";[RED]-#,##0"円"';

function autoWidths(rows: (string | number)[][]): { wch: number }[] {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      const len = String(cell ?? '').length;
      widths[i] = Math.max(widths[i] ?? 8, len + 2);
    });
  }
  return widths.map(w => ({ wch: Math.min(w, 40) }));
}

function recordsSheet(): XLSX.WorkSheet {
  const header = ['日付', '時刻', '店舗名', '種目', 'IN', 'OUT', '収支', 'メモ'];
  const records = getRecords().slice().sort((a, b) => a.date.localeCompare(b.date));
  const body = records.map(r => [
    r.date, r.time ?? '', r.storeName,
    CATEGORY_LABELS[r.category] ?? r.category,
    r.inAmount, r.outAmount, r.profit, r.memo ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = autoWidths([header, ...body]);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: header.length - 1 } }) };
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
  for (let r = 0; r < body.length; r++) {
    for (const c of [4, 5, 6]) {
      const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c })];
      if (cell) cell.z = YEN_FMT;
    }
  }
  return ws;
}

function rankingSheet(title: string, items: { label: string; profit: number; count: number }[]): XLSX.WorkSheet {
  const header = [title, '収支', '回数'];
  const body = items.map(i => [i.label, i.profit, i.count]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = autoWidths([header, ...body]);
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
  for (let r = 0; r < body.length; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c: 1 })];
    if (cell) cell.z = YEN_FMT;
  }
  return ws;
}

function summarySheet(): XLSX.WorkSheet {
  const records = getRecords();
  const totalIn = records.reduce((s, r) => s + r.inAmount, 0);
  const totalOut = records.reduce((s, r) => s + r.outAmount, 0);
  const totalProfit = totalIn === 0 && totalOut === 0 ? 0 : totalOut - totalIn;
  const winDays = new Set(records.filter(r => r.profit > 0).map(r => r.date)).size;
  const lossDays = new Set(records.filter(r => r.profit < 0).map(r => r.date)).size;
  const rows: (string | number)[][] = [
    ['項目', '値'],
    ['総IN', totalIn],
    ['総OUT', totalOut],
    ['総収支', totalProfit],
    ['記録件数', records.length],
    ['勝ち日数（日別・記録単位ではない目安）', winDays],
    ['負け日数（日別・記録単位ではない目安）', lossDays],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = autoWidths(rows);
  for (const r of [1, 2, 3]) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell) cell.z = YEN_FMT;
  }
  return ws;
}

export function buildWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet(), 'サマリー');
  XLSX.utils.book_append_sheet(wb, recordsSheet(), '記録');
  XLSX.utils.book_append_sheet(wb, rankingSheet('店舗', getStoreRanking()), '店舗別集計');
  XLSX.utils.book_append_sheet(wb, rankingSheet('種目', getCategoryRanking()), '種目別集計');
  XLSX.utils.book_append_sheet(wb, rankingSheet('月', getMonthRanking()), '月別集計');
  return wb;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function exportXLSX(): void {
  const wb = buildWorkbook();
  XLSX.writeFile(wb, `zenicho_${today()}.xlsx`);
}

export function getXLSXFile(): { blob: Blob; filename: string } {
  const wb = buildWorkbook();
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `zenicho_${today()}.xlsx` };
}
