import type { AggregateItem } from '../storage';
import {
  getRecordsForDealer, getCustomerSummaryForRecords, getShuffleSummaryForRecords, formatYen,
} from '../storage';
import { BreakdownList } from './BreakdownList';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  dealer: AggregateItem;
  onBack: () => void;
}

export function DealerDetail({ dealer, onBack }: Props) {
  const records = getRecordsForDealer(dealer.label);
  const customerItems = getCustomerSummaryForRecords(records);
  const shuffleItems = getShuffleSummaryForRecords(records);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← ディーラー別集計に戻る
      </button>

      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 10 }}>
          {dealer.label} の成績
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>対応回数</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{dealer.count.toLocaleString()}回</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>スタート合計 / エンド合計</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>
            {dealer.startSum.toLocaleString()} / {dealer.endSum.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
          <span style={{
            fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
            color: dealer.storeProfit > 0 ? GOLDB : dealer.storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(dealer.storeProfit)}円
            {dealer.holdRate !== null && ` （${(dealer.holdRate * 100).toFixed(1)}%）`}
          </span>
        </div>
      </div>

      <BreakdownList title="客別内訳" items={customerItems} showChart />
      <BreakdownList title="シャッフル別内訳" items={shuffleItems} showChart />

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, marginBottom: 8, letterSpacing: '0.05em' }}>
        対応履歴（{records.length}件）
      </div>
      {records.map(r => {
        const profit = r.endAmount - r.startAmount;
        return (
          <div key={r.id} style={{
            background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>{r.date}{r.table ? ` ${r.table}` : ''}</span>
              <span style={{
                fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
                color: profit > 0 ? GOLDB : profit < 0 ? REDB : SUB,
              }}>
                {formatYen(profit)}円
              </span>
            </div>
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
              {r.shuffle}
              {r.customerIds && r.customerIds.length > 0 && ` / ${r.customerIds.join('、')}`}
            </div>
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
              スタート {r.startAmount.toLocaleString()} / エンド {r.endAmount.toLocaleString()}
            </div>
            {r.memo && <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginTop: 4 }}>{r.memo}</div>}
          </div>
        );
      })}
    </div>
  );
}
