import { useState } from 'react';
import {
  getDealerSummary, getShuffleSummary, getCustomerSummary,
  getYearSummary, getMonthSummary, getWeekSummary, getWeekdaySummary,
  getRecordsForYear, getRecordsForMonth, getRecordsForWeek, getRecordsForWeekday,
  getOverallSummary, formatYen,
} from '../storage';
import type { AggregateItem } from '../storage';
import type { BaccaratRecord } from '../types';
import { CustomerDetail } from '../components/CustomerDetail';
import { PeriodDetail } from '../components/PeriodDetail';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELTD, NAV_H } from '../theme';

interface Props {
  refreshKey: number;
}

type Tab = 'dealer' | 'shuffle' | 'customer' | 'year' | 'month' | 'week' | 'weekday';
type PeriodTab = 'year' | 'month' | 'week' | 'weekday';
const PERIOD_TABS: PeriodTab[] = ['year', 'month', 'week', 'weekday'];

const TABS: { id: Tab; label: string }[] = [
  { id: 'dealer',   label: 'ディーラー別' },
  { id: 'shuffle',  label: 'シャッフル別' },
  { id: 'customer', label: '客別' },
  { id: 'year',     label: '年別' },
  { id: 'month',    label: '月別' },
  { id: 'week',     label: '週別' },
  { id: 'weekday',  label: '曜日別' },
];

function List({ items, onSelect }: { items: AggregateItem[]; onSelect?: (item: AggregateItem) => void }) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '30px 0' }}>データがありません</div>;
  }
  return (
    <>
      {items.map(it => (
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
              color: it.storeProfit > 0 ? GOLDB : it.storeProfit < 0 ? REDB : SUB,
            }}>
              {formatYen(it.storeProfit)}円
            </span>
          </div>
          <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
            対応 {it.count}回 スタート {it.startSum.toLocaleString()} エンド {it.endSum.toLocaleString()}
            {it.holdRate !== null && ` ホールド率 ${(it.holdRate * 100).toFixed(1)}%`}
          </div>
        </div>
      ))}
    </>
  );
}

const SUMMARY_FNS: Record<Tab, () => AggregateItem[]> = {
  dealer: getDealerSummary,
  shuffle: getShuffleSummary,
  customer: getCustomerSummary,
  year: getYearSummary,
  month: getMonthSummary,
  week: getWeekSummary,
  weekday: getWeekdaySummary,
};

const RECORDS_FOR_PERIOD: Record<PeriodTab, (label: string) => BaccaratRecord[]> = {
  year: getRecordsForYear,
  month: getRecordsForMonth,
  week: getRecordsForWeek,
  weekday: getRecordsForWeekday,
};

export function BaccaratSummaryScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<Tab>('dealer');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregateItem | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<{ kind: PeriodTab; item: AggregateItem } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  void refreshKey;

  const overall = getOverallSummary();
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

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: NAV_H + 16 }}>
        {selectedCustomer ? (
          <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
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
              <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginBottom: 8 }}>全体サマリー</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>記録件数</span>
                <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{overall.count.toLocaleString()}件</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>スタート合計 / エンド合計</span>
                <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>
                  {overall.startSum.toLocaleString()} / {overall.endSum.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>店収支合計</span>
                <span style={{
                  fontSize: 18, fontWeight: 800, fontFamily: BRUSH,
                  color: overall.storeProfit > 0 ? GOLDB : overall.storeProfit < 0 ? REDB : SUB,
                }}>
                  {formatYen(overall.storeProfit)}円
                  {overall.holdRate !== null && ` （${(overall.holdRate * 100).toFixed(1)}%）`}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
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
                <List items={visibleItems} onSelect={setSelectedCustomer} />
              </>
            ) : PERIOD_TABS.includes(tab as PeriodTab) ? (
              <List items={items} onSelect={it => setSelectedPeriod({ kind: tab as PeriodTab, item: it })} />
            ) : (
              <List items={items} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
