import { useState } from 'react';
import {
  getCustomerSummaryForRecords, getDealerSummaryForRecords, getShuffleSummaryForRecords,
  getYearSummary, getMonthSummary, getDaySummary,
  getRecordsForYear, getRecordsForMonth, getRecordsForDay, getRecordsForThisMonth,
  getThisMonthSummary, formatYen,
} from '../storage';
import type { AggregateItem } from '../storage';
import type { BaccaratRecord } from '../types';
import { CustomerDetail } from '../components/CustomerDetail';
import { DealerDetail } from '../components/DealerDetail';
import { ShuffleDetail } from '../components/ShuffleDetail';
import { PeriodDetail } from '../components/PeriodDetail';
import { BarChart } from '../components/BarChart';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELTD, NAV_SAFE_BOTTOM } from '../theme';

interface Props {
  refreshKey: number;
}

type PeriodTab = 'year' | 'month' | 'day';
type Tab = PeriodTab | 'customer' | 'dealer' | 'shuffle';

// 客別・ディーラー別・シャッフル別は今月分のみを集計する（全期間分は
// 年別/月別/日別タブや、各詳細画面内の内訳から確認できる）。
const MONTHLY_TABS: Tab[] = ['customer', 'dealer', 'shuffle'];

const TABS: { id: Tab; label: string }[] = [
  { id: 'year',     label: '年別' },
  { id: 'month',    label: '月別' },
  { id: 'day',      label: '日別' },
  { id: 'customer', label: '客別' },
  { id: 'dealer',   label: 'ディーラー別' },
  { id: 'shuffle',  label: 'シャッフル別' },
];

function List({ items, onSelect, invert, showCustomerCount, showAmounts = true }: {
  items: AggregateItem[]; onSelect?: (item: AggregateItem) => void; invert?: boolean;
  showCustomerCount?: boolean; showAmounts?: boolean;
}) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '30px 0' }}>データがありません</div>;
  }
  return (
    <>
      {items.map(it => {
        const positive = it.storeProfit > 0;
        const negative = it.storeProfit < 0;
        const displayValue = invert ? -it.storeProfit : it.storeProfit;
        return (
          <div
            key={it.label}
            onClick={onSelect ? () => onSelect(it) : undefined}
            style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: BRUSH }}>
                {it.label}{onSelect && <span style={{ color: SUB, fontWeight: 400 }}> ›</span>}
              </span>
              <span style={{
                fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
                color: positive ? GOLDB : negative ? REDB : SUB,
              }}>
                {formatYen(displayValue)}円
              </span>
            </div>
            <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
              対応 {it.count}回
              {showAmounts && ` スタート ${it.startSum.toLocaleString()} エンド ${it.endSum.toLocaleString()}`}
              {it.holdRate !== null && ` ホールド率 ${(it.holdRate * 100).toFixed(1)}%`}
              {showCustomerCount && it.customerCount !== undefined && ` 入客 ${it.customerCount}人`}
            </div>
          </div>
        );
      })}
    </>
  );
}

const SUMMARY_FNS: Record<Tab, () => AggregateItem[]> = {
  customer: () => getCustomerSummaryForRecords(getRecordsForThisMonth()),
  dealer: () => getDealerSummaryForRecords(getRecordsForThisMonth()),
  shuffle: () => getShuffleSummaryForRecords(getRecordsForThisMonth()),
  year: getYearSummary,
  month: getMonthSummary,
  day: getDaySummary,
};

const RECORDS_FOR_PERIOD: Record<PeriodTab, (label: string) => BaccaratRecord[]> = {
  year: getRecordsForYear,
  month: getRecordsForMonth,
  day: getRecordsForDay,
};

export function BaccaratSummaryScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<Tab>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregateItem | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<AggregateItem | null>(null);
  const [selectedShuffle, setSelectedShuffle] = useState<AggregateItem | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<{ kind: PeriodTab; item: AggregateItem } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  void refreshKey;

  const thisMonth = getThisMonthSummary();
  const items = SUMMARY_FNS[tab]();
  const visibleItems = tab === 'customer' && customerSearch.trim()
    ? items.filter(it => it.label.toLowerCase().includes(customerSearch.trim().toLowerCase()))
    : items;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>集計</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: `calc(${NAV_SAFE_BOTTOM} + 16px)` }}>
        {selectedCustomer ? (
          <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
        ) : selectedDealer ? (
          <DealerDetail dealer={selectedDealer} onBack={() => setSelectedDealer(null)} />
        ) : selectedShuffle ? (
          <ShuffleDetail shuffle={selectedShuffle} onBack={() => setSelectedShuffle(null)} />
        ) : selectedPeriod ? (
          <PeriodDetail
            kind={selectedPeriod.kind}
            period={selectedPeriod.item}
            records={RECORDS_FOR_PERIOD[selectedPeriod.kind](selectedPeriod.item.label)}
            onBack={() => setSelectedPeriod(null)}
          />
        ) : (
          <>
            <div style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginBottom: 8 }}>今月の集計（{thisMonth.monthLabel}）</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>記録件数</span>
                <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{thisMonth.count.toLocaleString()}件</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
                <span style={{
                  fontSize: 18, fontWeight: 800, fontFamily: BRUSH,
                  color: thisMonth.storeProfit > 0 ? GOLDB : thisMonth.storeProfit < 0 ? REDB : SUB,
                }}>
                  {formatYen(thisMonth.storeProfit)}円
                  {thisMonth.holdRate !== null && ` （${(thisMonth.holdRate * 100).toFixed(1)}%）`}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 14 }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '9px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
                    background: tab === t.id ? `${GOLD}18` : 'transparent',
                    border: `1px solid ${tab === t.id ? GOLD : BDR}`,
                    color: tab === t.id ? GOLDB : SUB, cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {MONTHLY_TABS.includes(tab) && (
              <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginBottom: 10 }}>
                {thisMonth.monthLabel}分のみ集計（全期間は年別/月別/日別、または各詳細画面の内訳から確認できます）
              </div>
            )}

            {tab === 'customer' ? (
              <>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="客IDで検索"
                  style={{
                    width: '100%', padding: '9px 12px', marginBottom: 10,
                    background: '#0a0f0c', border: `1px solid ${BDR}`, borderRadius: 6,
                    fontSize: 13, color: TEXT, fontFamily: BRUSH, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <BarChart items={visibleItems} onSelect={setSelectedCustomer} invert />
                <List items={visibleItems} onSelect={setSelectedCustomer} invert showAmounts={false} />
              </>
            ) : tab === 'dealer' ? (
              <>
                <BarChart items={items} onSelect={setSelectedDealer} />
                <List items={items} onSelect={setSelectedDealer} />
              </>
            ) : tab === 'shuffle' ? (
              <>
                <BarChart items={items} onSelect={setSelectedShuffle} />
                <List items={items} onSelect={setSelectedShuffle} />
              </>
            ) : (
              <>
                {tab === 'day' && (
                  <BarChart items={items} onSelect={it => setSelectedPeriod({ kind: tab, item: it })} />
                )}
                <List items={items} onSelect={it => setSelectedPeriod({ kind: tab as PeriodTab, item: it })} showCustomerCount />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
