import { useEffect, useState, useCallback } from 'react';
import type { RankingItem } from '../storage';
import {
  getTotalProfit, getMonthProfit, getMonthSummary,
  getMonthStoreRanking, formatAmount,
  getStoreRanking, getCategoryRanking, getStoreCategoryRanking,
} from '../storage';

interface Props { refreshKey: number; }

const NAV_H = 60;
const GOLD  = '#C9A227';
const GOLDB = '#F5D060';
const RED   = '#9B1C10';
const CARD  = '#0F0E0A';
const BDR   = '#222018';
const GBRD  = 'rgba(201,162,39,0.22)';
const TEXT  = '#EDE3C0';
const SUB   = '#524938';
const DIM   = '#2E2A1E';
const BRUSH = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
const MEDAL = ['#C9A227', '#9AA0A6', '#9C6E3C'];

function profitColor(v: number) { return v > 0 ? GOLDB : v < 0 ? RED : SUB; }

function totalFontSize(value: number): number {
  const len = formatAmount(Math.abs(value)).length;
  if (len <= 4)  return 72;
  if (len <= 6)  return 60;
  if (len <= 8)  return 50;
  if (len <= 10) return 42;
  return 34;
}

function ZeniAmt({ value, size, glow }: { value: number; size: number; glow?: boolean }) {
  const c = profitColor(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
      <span style={{
        fontSize: size, fontWeight: 800, fontFamily: BRUSH, color: c, lineHeight: 1,
        textShadow: glow && value !== 0 ? `0 0 40px ${c}77, 0 0 12px ${c}55` : undefined,
      }}>
        {formatAmount(value)}
      </span>
      <span style={{ fontSize: Math.max(size * 0.28, 11), fontWeight: 700, fontFamily: BRUSH, color: `${c}88`, letterSpacing: '0.05em' }}>
        ゼニ
      </span>
    </span>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 20px' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}22)` }} />
      <span style={{ color: `${GOLD}35`, fontSize: 8 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${GOLD}22,transparent)` }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 2, height: 14, background: GOLD, borderRadius: 1 }} />
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: TEXT, fontFamily: BRUSH }}>
        {children}
      </span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: CARD, border: `1px solid ${BDR}`, borderRadius: 8,
      padding: '10px 4px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: SUB, fontFamily: BRUSH, letterSpacing: '0.1em', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: BRUSH, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function RankRow({ item, rank }: { item: RankingItem; rank: number }) {
  const medal = MEDAL[rank - 1] ?? DIM;
  const isPos = item.profit >= 0;
  const top   = rank === 1;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px',
      borderBottom: rank < 3 ? `1px solid ${BDR}` : 'none',
      background: top ? `linear-gradient(90deg,${GOLD}06,transparent 60%)` : 'transparent',
    }}>
      <div style={{
        width: top ? 42 : 32, height: top ? 42 : 32, borderRadius: '50%', flexShrink: 0,
        border: `${top ? 2 : 1.5}px solid ${medal}`, background: `${medal}${top ? '22' : '14'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: top ? 12 : 10, fontWeight: 800, color: medal, fontFamily: BRUSH,
        boxShadow: top ? `0 0 12px ${medal}55` : 'none',
      }}>
        {rank}位
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: top ? TEXT : `${TEXT}AA`,
          fontFamily: BRUSH, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2,
        }}>
          {item.label}
        </div>
        <div style={{ fontSize: 10, color: SUB, fontFamily: BRUSH }}>{item.count}戦</div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{
            fontSize: top ? 17 : 15, fontWeight: 800, fontFamily: BRUSH,
            color: isPos ? (top ? GOLDB : GOLD) : RED,
          }}>
            {formatAmount(item.profit)}
          </span>
          <span style={{ fontSize: top ? 8 : 7, fontFamily: BRUSH, color: `${isPos ? GOLD : RED}77` }}>
            ゼニ
          </span>
        </div>
      </div>
    </div>
  );
}

type RankTab = 'store' | 'category' | 'storecat';
const RANK_TABS: { id: RankTab; label: string }[] = [
  { id: 'store',    label: '店舗別'   },
  { id: 'category', label: '種目別'   },
  { id: 'storecat', label: '店舗×種目' },
];

function AllTimeRanking({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab]           = useState<RankTab>('store');
  const [storeItems,    setStoreItems]    = useState<RankingItem[]>([]);
  const [catItems,      setCatItems]      = useState<RankingItem[]>([]);
  const [storeCatItems, setStoreCatItems] = useState<RankingItem[]>([]);

  useEffect(() => {
    setStoreItems(getStoreRanking());
    setCatItems(getCategoryRanking());
    setStoreCatItems(getStoreCategoryRanking());
  }, [refreshKey]);

  const items = tab === 'store' ? storeItems : tab === 'category' ? catItems : storeCatItems;
  const maxAbs = Math.max(...items.map(i => Math.abs(i.profit)), 1);

  return (
    <>
      {/* Tab row */}
      <div style={{ display: 'flex', marginBottom: 14, background: CARD, borderRadius: 8, padding: 3, border: `1px solid ${BDR}` }}>
        {RANK_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '7px 0', fontSize: 11, fontWeight: tab === t.id ? 800 : 400,
              fontFamily: BRUSH, letterSpacing: '0.05em',
              background: tab === t.id ? `${GOLD}18` : 'transparent',
              border: tab === t.id ? `1px solid ${GOLD}44` : '1px solid transparent',
              borderRadius: 6,
              color: tab === t.id ? GOLDB : SUB,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{
          background: CARD, border: `1px solid ${BDR}`, borderRadius: 10,
          padding: '28px', textAlign: 'center', fontSize: 13, color: SUB, fontFamily: BRUSH,
        }}>
          データがありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.slice(0, 10).map((item, idx) => {
            const medal = MEDAL[idx] ?? DIM;
            const isPos = item.profit >= 0;
            const pct   = (Math.abs(item.profit) / maxAbs) * 100;
            return (
              <div key={item.label} style={{
                background: idx < 3
                  ? `linear-gradient(90deg,${medal}0A,${CARD} 55%)`
                  : CARD,
                border: `1px solid ${idx < 3 ? `${medal}33` : BDR}`,
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Badge */}
                <div style={{
                  width: idx === 0 ? 44 : 34, height: idx === 0 ? 44 : 34,
                  borderRadius: '50%', flexShrink: 0,
                  border: `${idx === 0 ? 2 : 1.5}px solid ${idx < 3 ? medal : SUB}`,
                  background: idx === 0 ? `${medal}22` : idx < 3 ? `${medal}14` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: idx === 0 ? 11 : 9, fontWeight: 800,
                  color: idx < 3 ? medal : `${TEXT}44`,
                  fontFamily: BRUSH,
                  boxShadow: idx === 0 ? `0 0 14px ${medal}55` : 'none',
                }}>
                  {idx + 1}位
                </div>
                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: idx < 3 ? TEXT : `${TEXT}99`,
                    fontFamily: BRUSH,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 5,
                  }}>
                    {item.label}
                  </div>
                  {/* Bar */}
                  <div style={{ height: 3, background: `${GOLD}15`, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 2,
                      background: isPos
                        ? `linear-gradient(90deg,${GOLD},${GOLDB}88)`
                        : `linear-gradient(90deg,${RED},#FF333388)`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: SUB, fontFamily: BRUSH }}>{item.count}戦</span>
                </div>
                {/* Amount */}
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: idx === 0 ? 17 : 15, fontWeight: 800, fontFamily: BRUSH,
                    color: isPos ? (idx === 0 ? GOLDB : GOLD) : RED,
                  }}>
                    {formatAmount(item.profit)}
                  </span>
                  <span style={{ fontSize: 7, fontFamily: BRUSH, color: `${isPos ? GOLD : RED}66` }}>ゼニ</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function HomeScreen({ refreshKey }: Props) {
  const now = new Date();
  const [total,   setTotal]   = useState(0);
  const [month,   setMonth]   = useState(0);
  const [summary, setSummary] = useState({ winDays: 0, lossDays: 0, evenDays: 0, recoveryRate: null as number | null });
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  const refresh = useCallback(() => {
    const y = now.getFullYear(), m = now.getMonth() + 1;
    setTotal(getTotalProfit());
    setMonth(getMonthProfit());
    setSummary(getMonthSummary(y, m));
    setRanking(getMonthStoreRanking(y, m));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const recRate = summary.recoveryRate;

  return (
    <div style={{ background: '#0A0905', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── ヘッダー ── */}
      <div style={{
        flexShrink: 0,
        borderBottom: `1px solid ${BDR}`,
        background: 'linear-gradient(180deg,#0E0D08 0%,#0A0905 100%)',
      }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
        <div style={{ padding: '14px 0 12px', textAlign: 'center' }}>
          <div style={{
            fontSize: 42, fontWeight: 800, letterSpacing: '0.22em',
            color: GOLD, fontFamily: BRUSH, lineHeight: 1,
            textShadow: `0 2px 14px ${GOLD}55`,
          }}>
            ゼニ帳
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6 }}>
            <div style={{ width: 32, height: 1, background: `${GOLD}35` }} />
            <span style={{ fontSize: 9, letterSpacing: '0.5em', color: `${GOLD}65`, fontFamily: BRUSH }}>戦績管理</span>
            <div style={{ width: 32, height: 1, background: `${GOLD}35` }} />
          </div>
        </div>
      </div>

      {/* ── スクロールコンテンツ ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: NAV_H + 16 }}>

        {/* ① 生涯収支 */}
        <div style={{
          textAlign: 'center', padding: '40px 16px 36px',
          background: 'radial-gradient(ellipse at 50% 30%,rgba(201,162,39,0.13) 0%,transparent 68%)',
        }}>
          {/* 装飾ライン + ラベル */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '0 8px' }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}50)` }} />
            <span style={{
              fontSize: 12, letterSpacing: '0.65em', color: `${GOLDB}CC`,
              fontFamily: BRUSH, fontWeight: 700,
            }}>
              生 涯 収 支
            </span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${GOLD}50,transparent)` }} />
          </div>
          {/* 金額 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
            <ZeniAmt value={total} size={totalFontSize(total)} glow />
          </div>
        </div>

        <Divider />

        {/* ② 今月の収支 */}
        <div style={{ padding: '20px 16px' }}>
          <SectionTitle>{now.getMonth() + 1}月の収支</SectionTitle>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <ZeniAmt value={month} size={38} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <StatCard label="勝ち日" value={`${summary.winDays}日`} color={GOLD} />
            <StatCard label="負け日" value={`${summary.lossDays}日`} color={RED} />
            <StatCard
              label="回収率"
              value={recRate !== null ? `${recRate}%` : '—'}
              color={recRate !== null ? (recRate >= 100 ? GOLD : RED) : SUB}
            />
          </div>
        </div>

        <Divider />

        {/* ③ 今月の戦場ランキング（TOP3） */}
        <div style={{ padding: '20px 16px' }}>
          <SectionTitle>今月の戦場ランキング</SectionTitle>
          {ranking.length > 0 ? (
            <div style={{
              background: CARD,
              border: `1px solid ${GBRD}`,
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: `0 0 24px ${GOLD}09`,
            }}>
              {ranking.slice(0, 3).map((item, i) => (
                <RankRow key={item.label} item={item} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 10,
              padding: '20px', textAlign: 'center', fontSize: 13, color: SUB, fontFamily: BRUSH,
            }}>
              今月のデータがありません
            </div>
          )}
        </div>

        <Divider />

        {/* ④ 全期間ランキング */}
        <div style={{ padding: '20px 16px' }}>
          <SectionTitle>全期間ランキング</SectionTitle>
          <AllTimeRanking refreshKey={refreshKey} />
        </div>

      </div>
    </div>
  );
}
