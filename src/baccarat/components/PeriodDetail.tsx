import type { BaccaratRecord } from '../types';
import type { AggregateItem } from '../storage';
import {
  getCustomerSummaryForRecords, getWeekdaySummaryForRecords,
  getDealerSummaryForRecords, getShuffleSummaryForRecords,
  groupRecordsByDay, getUniqueCustomerCount, formatYen,
} from '../storage';
import { BarChart } from './BarChart';
import { BreakdownList } from './BreakdownList';
import { DayGroupHeader } from './DayGroupHeader';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

type PeriodKind = 'year' | 'month' | 'day';

interface Props {
  kind: PeriodKind;
  period: AggregateItem;
  records: BaccaratRecord[];
  onBack: () => void;
}

function ChartBreakdown({ title, items }: { title: string; items: AggregateItem[] }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        {title}（{items.length}）
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '16px 0' }}>データがありません</div>
      ) : (
        <BarChart items={items} />
      )}
    </>
  );
}

export function PeriodDetail({ kind, period, records, onBack }: Props) {
  const swipeStyle = useSwipeBack(onBack);
  const customerItems = getCustomerSummaryForRecords(records);
  const dealerItems = getDealerSummaryForRecords(records);
  const shuffleItems = getShuffleSummaryForRecords(records);
  const weekdayItems = kind === 'day' ? null : getWeekdaySummaryForRecords(records);
  const dayGroups = groupRecordsByDay(records);

  return (
    <div style={swipeStyle}>
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
        {period.customerCount !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>入客数</span>
            <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{period.customerCount.toLocaleString()}人</span>
          </div>
        )}
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

      <BreakdownList title="客別内訳" items={customerItems} invert showAmounts={false} />
      <ChartBreakdown title="ディーラー別内訳" items={dealerItems} />
      <ChartBreakdown title="シャッフル別内訳" items={shuffleItems} />
      {weekdayItems && <BreakdownList title="曜日別内訳" items={weekdayItems} />}

      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        来店履歴（{records.length}シュート）
      </div>
      {dayGroups.map((group, gi) => {
        const dayProfit = group.records.reduce((s, r) => s + (r.endAmount - r.startAmount), 0);
        return (
          <div key={group.date} style={{ marginTop: gi === 0 ? 0 : 20 }}>
            <DayGroupHeader
              label={group.label} count={group.records.length} amount={dayProfit}
              customerCount={getUniqueCustomerCount(group.records)}
            />
            {group.records.map((r, ri) => {
              const profit = r.endAmount - r.startAmount;
              return (
                <div key={r.id} style={{
                  background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>
                      {ri + 1}シュート{r.table ? ` ・ ${r.table}` : ''}
                    </span>
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
      })}
    </div>
  );
}
