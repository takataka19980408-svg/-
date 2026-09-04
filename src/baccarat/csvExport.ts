import { getRecords, today } from './storage';

export function getCSVText(): string {
  const header = ['日付', '卓', 'ディーラー', 'シャッフル方式', '客ID', '客スタート', '客エンド', '収支', 'メモ'];
  const records = getRecords().slice().sort((a, b) => a.date.localeCompare(b.date));
  const rows = records.map(r => [
    r.date, r.table, r.dealerIds.join('、'), r.shuffle, (r.customerIds ?? []).join('、'),
    r.startAmount, r.endAmount, r.profit, r.memo ?? '',
  ].join(','));
  return '﻿' + [header.join(','), ...rows].join('\r\n');
}

export function getCSVFilename(): string {
  return `baccarat_ops_${today()}.csv`;
}
