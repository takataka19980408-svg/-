import { useState } from 'react';
import { getDealerSummary, getShuffleSummary, getCustomerSummary, getOverallSummary, formatYen } from '../storage';
import type { AggregateItem } from '../storage';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, FELTD, NAV_H } from '../theme';

interface Props {
  refreshKey: number;
}

type Tab = 'dealer' | 'shuffle' | 'customer';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dealer',   label: 'ディーラー別' },
  { id: 'shuffle',  label: 'シャッフル別' },
  { id: 'customer', label: '客別' },
];

function List({ items }: { items: AggregateItem[] }) {
  if (items.length === 0) {
    return <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '30px 0' }}>データがありません</div>;
  }
  return (
    <>
      {items.map(it => (
        <div key={it.label} style={{
          background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: BRUSH }}>{it.label}</span>
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

export function BaccaratSummaryScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<Tab>('dealer');
  void refreshKey;

  const overall = getOverallSummary();
  const items = tab === 'dealer' ? getDealerSummary() : tab === 'shuffle' ? getShuffleSummary() : getCustomerSummary();

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>集計</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>
        <div style={{
          background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginBottom: 8 }}>全体サマリー</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>記録件数</span>
            <span style={{ fontSize: 13, color: TEXT, fontFamily: BRUSH }}>{overall.count}件</span>
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

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
                background: tab === t.id ? `${GOLD}18` : 'transparent',
                border: `1px solid ${tab === t.id ? GOLD : BDR}`,
                color: tab === t.id ? GOLDB : SUB, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <List items={items} />
      </div>
    </div>
  );
}
