import type { AggregateItem } from '../storage';
import { getRecordsForCustomer, formatYen } from '../storage';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  customer: AggregateItem;
  onBack: () => void;
}

export function CustomerDetail({ customer, onBack }: Props) {
  const records = getRecordsForCustomer(customer.label);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← 客別集計に戻る
      </button>

      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 10 }}>
          {customer.label} の成績
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>来店回数</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{customer.count.toLocaleString()}回</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>スタート合計 / エンド合計</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>
            {customer.startSum.toLocaleString()} / {customer.endSum.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
          <span style={{
            fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
            color: customer.storeProfit > 0 ? GOLDB : customer.storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(customer.storeProfit)}円
            {customer.holdRate !== null && ` （${(customer.holdRate * 100).toFixed(1)}%）`}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, marginBottom: 8, letterSpacing: '0.05em' }}>
        来店履歴（{records.length}件）
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
              {r.dealerIds.join('、')} / {r.shuffle}
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
