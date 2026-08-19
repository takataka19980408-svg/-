import type { BaccaratRecord } from '../types';
import type { AggregateItem } from '../storage';
import { getCustomerSummaryForRecords, formatYen } from '../storage';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  period: AggregateItem;
  records: BaccaratRecord[];
  onBack: () => void;
}

export function PeriodDetail({ period, records, onBack }: Props) {
  const customerItems = getCustomerSummaryForRecords(records);

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← 一覧に戻る
      </button>

      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 10 }}>
          {period.label} の成績
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>記録件数</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{period.count.toLocaleString()}件</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>スタート合計 / エンド合計</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>
            {period.startSum.toLocaleString()} / {period.endSum.toLocaleString()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
          <span style={{
            fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
            color: period.storeProfit > 0 ? GOLDB : period.storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(period.storeProfit)}円
            {period.holdRate !== null && ` （${(period.holdRate * 100).toFixed(1)}%）`}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, marginBottom: 8, letterSpacing: '0.05em' }}>
        客別内訳（{customerItems.length}名）
      </div>
      {customerItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '16px 0' }}>データがありません</div>
      ) : (
        customerItems.map(c => (
          <div key={c.label} style={{
            background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: BRUSH }}>{c.label}</span>
              <span style={{
                fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                color: c.storeProfit > 0 ? GOLDB : c.storeProfit < 0 ? REDB : SUB,
              }}>
                {formatYen(c.storeProfit)}円
              </span>
            </div>
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
              来店 {c.count}回 スタート {c.startSum.toLocaleString()} エンド {c.endSum.toLocaleString()}
            </div>
          </div>
        ))
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
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
