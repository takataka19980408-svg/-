import { useEffect, useState } from 'react';
import type { RankingItem } from '../storage';
import { getStoreRanking, getCategoryRanking, getStoreCategoryRanking, formatAmount } from '../storage';

interface Props { refreshKey: number; }

type RankTab = 'store' | 'category' | 'storecat';
const NAV_H = 60;

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_LABELS = ['1位', '2位', '3位'];

// Bar widths relative to top item
function RankList({ items }: { items: RankingItem[] }) {
  const maxAbs = Math.max(...items.map(i => Math.abs(i.profit)), 1);

  if (items.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-sub)', fontSize: 13, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 28, color: 'rgba(255,215,0,0.2)', marginBottom: 8 }}>無記録</div>
        データがありません
      </div>
    );
  }

  return (
    <div>
      {items.slice(0, 10).map((item, idx) => {
        const pct = (Math.abs(item.profit) / maxAbs) * 100;
        // inject bar fill width into card
        return (
          <div key={item.label} style={{
            background: idx < 3
              ? `radial-gradient(ellipse at 0% 50%, ${MEDAL_COLORS[idx] ?? ''}14 0%, var(--bg-card) 60%)`
              : 'var(--bg-card)',
            border: `1px solid ${idx < 3 ? (MEDAL_COLORS[idx] ?? '') + '40' : 'rgba(255,215,0,0.1)'}`,
            borderRadius: 10, padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Badge */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${idx < 3 ? MEDAL_COLORS[idx] : 'rgba(245,238,216,0.25)'}`,
              background: idx < 3 ? `${MEDAL_COLORS[idx]}18` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: idx < 3 ? MEDAL_COLORS[idx] : 'rgba(245,238,216,0.4)',
              fontFamily: 'sans-serif', fontWeight: 700,
            }}>
              {idx < 3 ? MEDAL_LABELS[idx] : `${idx + 1}位`}
            </div>
            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>
                {item.label}
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 2,
                  background: item.profit >= 0
                    ? 'linear-gradient(90deg,var(--gold),rgba(255,215,0,0.5))'
                    : 'linear-gradient(90deg,var(--loss),rgba(255,51,51,0.5))',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-sub)', fontFamily: 'sans-serif', marginTop: 2, display: 'block' }}>
                {item.count}戦
              </span>
            </div>
            {/* Profit */}
            <div style={{
              fontSize: 18, fontWeight: 900, fontFamily: 'sans-serif', flexShrink: 0,
              color: item.profit >= 0 ? (idx < 3 ? MEDAL_COLORS[idx] : 'var(--profit)') : 'var(--loss)',
              textShadow: idx < 3 ? `0 0 12px ${MEDAL_COLORS[idx]}55` : 'none',
            }}>
              {formatAmount(item.profit)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RankingScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<RankTab>('store');
  const [storeItems, setStoreItems] = useState<RankingItem[]>([]);
  const [catItems, setCatItems] = useState<RankingItem[]>([]);
  const [storeCatItems, setStoreCatItems] = useState<RankingItem[]>([]);

  useEffect(() => {
    setStoreItems(getStoreRanking());
    setCatItems(getCategoryRanking());
    setStoreCatItems(getStoreCategoryRanking());
  }, [refreshKey]);

  const tabs: { id: RankTab; label: string }[] = [
    { id: 'store', label: '店舗別' },
    { id: 'category', label: '種目別' },
    { id: 'storecat', label: '店舗×種目' },
  ];

  const currentItems = tab === 'store' ? storeItems : tab === 'category' ? catItems : storeCatItems;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 0', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--gold)', textShadow: '0 0 16px rgba(255,215,0,0.4)', fontFamily: '"Hiragino Mincho ProN",serif', marginBottom: 10 }}>
            ◆ 戦績ランキング ◆
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,215,0,0.1)' }}>
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 700,
                  fontFamily: 'sans-serif', letterSpacing: '0.05em',
                  background: 'transparent', border: 'none',
                  color: tab === id ? 'var(--gold)' : 'var(--text-sub)',
                  borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>
        <RankList items={currentItems} />
      </div>
    </div>
  );
}
