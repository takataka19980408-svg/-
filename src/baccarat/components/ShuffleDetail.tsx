import type { AggregateItem } from '../storage';
import {
  getRecordsForShuffle, getCustomerSummaryForRecords, getShuffleSummaryForRecords,
  getDealerSummaryForRecords, groupRecordsByDay, getShootNumbers, formatYen,
} from '../storage';
import { BreakdownList } from './BreakdownList';
import { DayGroupHeader } from './DayGroupHeader';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  shuffle: AggregateItem;
  onBack: () => void;
}

export function ShuffleDetail({ shuffle, onBack }: Props) {
  const swipeStyle = useSwipeBack(onBack);
  const records = getRecordsForShuffle(shuffle.label);
  // 呼び出し元のshuffleは今月分などスコープが絞られている場合があるため、
  // ここで取得した全期間のrecordsから改めて集計し直して表示する。
  const summary = getShuffleSummaryForRecords(records).find(it => it.label === shuffle.label) ?? shuffle;
  const customerItems = getCustomerSummaryForRecords(records);
  const dealerItems = getDealerSummaryForRecords(records);
  const dayGroups = groupRecordsByDay(records);
  const shootNumbers = getShootNumbers();

  return (
    <div style={swipeStyle}>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← シャッフル別集計に戻る
      </button>

      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 10 }}>
          {shuffle.label} の成績
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>シュート数</span>
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{summary.count.toLocaleString()}回</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
          <span style={{
            fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
            color: summary.storeProfit > 0 ? GOLDB : summary.storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(summary.storeProfit)}円
            {summary.holdRate !== null && ` （${(summary.holdRate * 100).toFixed(1)}%）`}
          </span>
        </div>
      </div>

      <BreakdownList title="客別内訳" items={customerItems} showChart invert showAmounts={false} />
      <BreakdownList title="ディーラー別内訳" items={dealerItems} showChart />

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        対応履歴（{records.length}シュート）
      </div>
      {dayGroups.map((group, gi) => {
        const dayProfit = group.records.reduce((s, r) => s + (r.endAmount - r.startAmount), 0);
        return (
          <div key={group.date} style={{ marginTop: gi === 0 ? 0 : 20 }}>
            <DayGroupHeader label={group.label} count={group.records.length} amount={dayProfit} />
            {group.records.map(r => {
              const profit = r.endAmount - r.startAmount;
              return (
                <div key={r.id} style={{
                  background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>
                      {shootNumbers.get(r.id)}シュート{r.table ? ` ・ ${r.table}` : ''}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
                      color: profit > 0 ? GOLDB : profit < 0 ? REDB : SUB,
                    }}>
                      {formatYen(profit)}円
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                    {r.dealerIds.join('、')}
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
      })}
    </div>
  );
}
