import { useEffect, useRef, useState } from 'react';
import type { AggregateItem } from '../storage';
import {
  getRecordsForCustomer, getDealerSummaryForCustomer, getShuffleSummaryForCustomer, getWeekdaySummaryForCustomer,
  getCustomerSummaryForRecords, getCustomerProfitForRecord, getWeekdayKey,
  groupRecordsByDay, getShootNumbers, getShortDayKey, formatYen,
} from '../storage';
import { BarChart } from './BarChart';
import { BreakdownList } from './BreakdownList';
import { DayGroupHeader } from './DayGroupHeader';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  customer: AggregateItem;
  onBack: () => void;
}

// 客個人の収支での内訳（店収支ではなく、その客自身の勝敗）。色は店収支の
// 符号のまま、表示数値だけ反転する（他画面のinvertと同じ考え方）。
function ChartBreakdown({ title, items }: { title: string; items: AggregateItem[] }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        {title}（{items.length}）
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '16px 0' }}>データがありません</div>
      ) : (
        <BarChart items={items} invert />
      )}
    </>
  );
}

export function CustomerDetail({ customer, onBack }: Props) {
  const swipeStyle = useSwipeBack(onBack);
  const [weekdayFilter, setWeekdayFilter] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const records = getRecordsForCustomer(customer.label);
  // 呼び出し元のcustomerは今月分などスコープが絞られている場合があるため、
  // ここで取得した全期間のrecordsから改めて集計し直して表示する。
  const summary = getCustomerSummaryForRecords(records).find(it => it.label === customer.label) ?? customer;
  const dealerItems = getDealerSummaryForCustomer(records, customer.label);
  const shuffleItems = getShuffleSummaryForCustomer(records, customer.label);
  const weekdayItems = getWeekdaySummaryForCustomer(records, customer.label);
  const historyRecords = weekdayFilter ? records.filter(r => getWeekdayKey(r.date) === weekdayFilter) : records;
  const dayGroups = groupRecordsByDay(historyRecords);
  const shootNumbers = getShootNumbers();

  useEffect(() => {
    if (weekdayFilter) historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [weekdayFilter]);

  return (
    <div style={swipeStyle}>
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
          <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{summary.count.toLocaleString()}回</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>客の収支合計</span>
          <span style={{
            fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
            color: summary.storeProfit > 0 ? GOLDB : summary.storeProfit < 0 ? REDB : SUB,
          }}>
            {formatYen(-summary.storeProfit)}円
          </span>
        </div>
      </div>

      <ChartBreakdown title="シャッフル別内訳" items={shuffleItems} />
      <ChartBreakdown title="ディーラー別内訳" items={dealerItems} />
      <BreakdownList
        title="曜日別内訳" items={weekdayItems} invert selected={weekdayFilter}
        onSelect={label => setWeekdayFilter(cur => (cur === label ? null : label))}
      />

      <div ref={historyRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, letterSpacing: '0.05em' }}>
          来店履歴（{historyRecords.length}シュート）
        </span>
        {weekdayFilter && (
          <button
            onClick={() => setWeekdayFilter(null)}
            style={{
              fontSize: 11, fontWeight: 700, fontFamily: BRUSH, color: GOLDB,
              background: `${GOLD}18`, border: `1px solid ${GOLD}`, borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer',
            }}
          >
            {weekdayFilter}のみ ×
          </button>
        )}
      </div>
      {dayGroups.map((group, gi) => {
        const dayAmount = group.records.reduce((s, r) => s + getCustomerProfitForRecord(r, customer.label), 0);
        return (
          <div key={group.date} style={{ marginTop: gi === 0 ? 0 : 20 }}>
            <DayGroupHeader label={group.label} count={group.records.length} amount={dayAmount} invert />
            {group.records.map(r => {
              const shared = (r.customerIds ?? []).length > 1;
              const profit = getCustomerProfitForRecord(r, customer.label);
              return (
                <div key={r.id} style={{
                  background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>
                      {getShortDayKey(r.date)} ・ {shootNumbers.get(r.id)}シュート{r.table ? ` ・ ${r.table}` : ''}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
                      color: profit > 0 ? GOLDB : profit < 0 ? REDB : SUB,
                    }}>
                      {formatYen(-profit)}円{shared && <span style={{ fontSize: 10, fontWeight: 400, color: SUB }}> （配分）</span>}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                    {r.shuffle} / {r.dealerIds.join('、')}
                    {shared && ` / 他の客: ${(r.customerIds ?? []).filter(id => id !== customer.label).join('、')}`}
                  </div>
                  <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                    スタート {r.startAmount.toLocaleString()} / エンド {r.endAmount.toLocaleString()}
                    {shared && `（店収支 ${formatYen(r.endAmount - r.startAmount)}円）`}
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
