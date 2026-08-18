import * as XLSX from 'xlsx';
import { getRecords, getDealerSummary, getShuffleSummary, getCustomerSummary, getOverallSummary, today } from './storage';

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

function logSheet(): XLSX.WorkSheet {
  const header = ['日付', '卓', 'ディーラー', 'シャッフル方式', '客ID', '客スタート', '客エンド', '収支', 'メモ'];
  const records = getRecords().slice().sort((a, b) => a.date.localeCompare(b.date));
  const body = records.map(r => [
    r.date, r.table, r.dealer, r.shuffle, r.customerId ?? '',
    r.startAmount, r.endAmount, r.profit, r.memo ?? '',
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = autoWidths([header, ...body]);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: header.length - 1 } }) };
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
  for (let r = 0; r < body.length; r++) {
    for (const c of [5, 6, 7]) {
      const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c })];
      if (cell) cell.z = YEN_FMT;
    }
  }
  return ws;
}

function summaryDimSheet(title: string, items: ReturnType<typeof getDealerSummary>): XLSX.WorkSheet {
  const header = [title, '対応件数', 'スタート合計', 'エンド合計', '店収支合計', 'ホールド率'];
  const body = items.map(i => [i.label, i.count, i.startSum, i.endSum, i.storeProfit, i.holdRate ?? '']);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = autoWidths([header, ...body]);
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];
  for (let r = 0; r < body.length; r++) {
    for (const c of [2, 3, 4]) {
      const cell = ws[XLSX.utils.encode_cell({ r: r + 1, c })];
      if (cell) cell.z = YEN_FMT;
    }
    const rateCell = ws[XLSX.utils.encode_cell({ r: r + 1, c: 5 })];
    if (rateCell && typeof rateCell.v === 'number') rateCell.z = '0.0%';
  }
  return ws;
}

function overallSheet(): XLSX.WorkSheet {
  const o = getOverallSummary();
  const rows: (string | number)[][] = [
    ['項目', '値'],
    ['記録件数', o.count],
    ['スタート合計', o.startSum],
    ['エンド合計', o.endSum],
    ['店収支合計', o.storeProfit],
    ['ホールド率', o.holdRate ?? ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = autoWidths(rows);
  for (const r of [1, 2, 3]) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell) cell.z = YEN_FMT;
  }
  const rateCell = ws[XLSX.utils.encode_cell({ r: 4, c: 1 })];
  if (rateCell && typeof rateCell.v === 'number') rateCell.z = '0.0%';
  return ws;
}

export function buildWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, overallSheet(), 'サマリー');
  XLSX.utils.book_append_sheet(wb, logSheet(), '入力ログ');
  XLSX.utils.book_append_sheet(wb, summaryDimSheet('ディーラー', getDealerSummary()), 'ディーラー別集計');
  XLSX.utils.book_append_sheet(wb, summaryDimSheet('シャッフル方式', getShuffleSummary()), 'シャッフル方式別集計');
  XLSX.utils.book_append_sheet(wb, summaryDimSheet('客ID', getCustomerSummary()), '客別来店履歴');
  return wb;
}

export function exportXLSX(): void {
  const wb = buildWorkbook();
  XLSX.writeFile(wb, `baccarat_ops_${today()}.xlsx`);
}

export function getXLSXFile(): { blob: Blob; filename: string } {
  const wb = buildWorkbook();
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, filename: `baccarat_ops_${today()}.xlsx` };
}
