import { useEffect, useState, useCallback } from 'react';
import type { RankingItem } from '../storage';
import {
  getTotalProfit, getMonthProfit, getMonthSummary,
  getMonthStoreRanking, formatAmountFull, formatAmount,
} from '../storage';

interface Props {
  onRecord: () => void;
  refreshKey: number;
}

const NAV_H = 60;
const FAB_H = 56;
const GOLD  = '#C9A227';
const GOLDB = '#F5D060';
const GOLDD = '#7A5C00';
const RED   = '#9B1C10';
const CARD  = '#100F0A';
const BDR   = '#1E1C10';
const GBRD  = 'rgba(201,162,39,0.28)';
const TEXT  = '#EDE3C0';
const SUB   = '#524938';
const BRUSH = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
const SANS  = 'sans-serif';
const MEDAL = ['#C9A227', '#9AA0A6', '#9C6E3C'];

/** 見出しラベル — 二重横線で囲んでバチバチに */
function Bachi({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontSize: 12, fontWeight: 800, letterSpacing: '0.55em',
        color: GOLDB, fontFamily: BRUSH,
      }}>
        <span style={{ display: 'inline-block', width: 24, height: 1, background: `${GOLD}90` }} />
        {children}
        <span style={{ display: 'inline-block', width: 24, height: 1, background: `${GOLD}90` }} />
      </span>
    </div>
  );
}

/** セクション見出し — 左金バー＋白テキスト */
function SecHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 16, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', color: TEXT, fontFamily: BRUSH }}>
        {children}
      </span>
    </div>
  );
}

function OrnLine() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}22)` }} />
      <span style={{ color: `${GOLD}44`, fontSize: 8 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${GOLD}22,transparent)` }} />
    </div>
  );
}

function RankRow({ item, rank }: { item: RankingItem; rank: number }) {
  const medal = MEDAL[rank - 1] ?? SUB;
  const isPos = item.profit >= 0;
  const top   = rank === 1;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0',
      borderBottom: rank < 3 ? `1px solid ${BDR}` : 'none',
      background: top ? `radial-gradient(ellipse at 0% 50%,${GOLD}07,transparent 70%)` : 'transparent',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${medal}`,
        background: `${medal}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: medal, fontFamily: BRUSH,
      }}>
        {rank}位
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: top ? TEXT : `${TEXT}BB`, fontFamily: BRUSH,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
        <div style={{ fontSize: 10, color: SUB, fontFamily: SANS }}>{item.count}戦</div>
      </div>
      <div style={{
        fontSize: top ? 18 : 15, fontWeight: 900, fontFamily: SANS, flexShrink: 0,
        color: isPos ? (top ? GOLDB : GOLD) : RED,
        textShadow: top && isPos ? `0 0 14px ${GOLD}66` : 'none',
      }}>
        {formatAmount(item.profit)}
      </div>
    </div>
  );
}

export function HomeScreen({ onRecord, refreshKey }: Props) {
  const now = new Date();
  const [total, setTotal]     = useState(0);
  const [month, setMonth]     = useState(0);
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

  const totalColor = total > 0 ? GOLDB : total < 0 ? RED : SUB;
  const monthColor = month > 0 ? GOLD  : month < 0 ? RED : SUB;
  const recRate    = summary.recoveryRate;

  return (
    <>
      {/* ── 画面全体 — スクロールなし ── */}
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: '#0A0905',
      }}>
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0,
          background: 'linear-gradient(180deg,#0E0D08,#0A0905)',
          borderBottom: `1px solid ${BDR}`,
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
          <div style={{ padding: '12px 20px 10px', textAlign: 'center' }}>
            <div style={{
              fontSize: 44, fontWeight: 800, letterSpacing: '0.2em', lineHeight: 1,
              color: GOLD, fontFamily: BRUSH,
              textShadow: `0 2px 16px ${GOLD}55, 0 0 48px ${GOLD}1A`,
            }}>
              ゼニ帳
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ width: 30, height: 1, background: `${GOLD}40` }} />
              <span style={{ fontSize: 9, letterSpacing: '0.45em', color: `${GOLD}70`, fontFamily: BRUSH }}>戦績管理</span>
              <div style={{ width: 30, height: 1, background: `${GOLD}40` }} />
            </div>
          </div>
        </div>

        {/* ── コンテンツ — flex 1 で画面を均等に埋める ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* 生涯収支 */}
          <div style={{
            flexShrink: 0, padding: '18px 20px 14px', textAlign: 'center',
            background: 'radial-gradient(ellipse at 50% 0%,rgba(201,162,39,0.07),transparent 70%)',
          }}>
            <Bachi>生 涯 収 支</Bachi>
            <div style={{
              fontSize: total === 0 ? 46 : Math.abs(total) >= 10000000 ? 40 : 54,
              fontWeight: 900, lineHeight: 1, fontFamily: SANS,
              color: totalColor,
              textShadow: total !== 0 ? `0 0 36px ${totalColor}55` : 'none',
            }}>
              {formatAmountFull(total)}
            </div>
          </div>

          <OrnLine />

          {/* 今月の収支 */}
          <div style={{ flexShrink: 0, padding: '12px 16px 10px' }}>
            <SecHead>{now.getMonth() + 1}月の収支</SecHead>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* 月合計 */}
              <div style={{
                fontSize: 36, fontWeight: 900, fontFamily: SANS, flexShrink: 0,
                color: monthColor,
                textShadow: month !== 0 ? `0 0 20px ${monthColor}55` : 'none',
              }}>
                {formatAmountFull(month)}
              </div>
              {/* Stats */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: '勝ち', value: `${summary.winDays}日`, color: GOLD },
                    { label: '負け', value: `${summary.lossDays}日`, color: RED  },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      flex: 1, background: CARD, border: `1px solid ${BDR}`,
                      borderRadius: 6, padding: '6px 0', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 9, color: SUB, fontFamily: BRUSH, letterSpacing: '0.1em' }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, fontFamily: SANS, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: CARD, border: `1px solid ${BDR}`,
                  borderRadius: 6, padding: '5px 0', textAlign: 'center',
                }}>
                  <span style={{ fontSize: 9, color: SUB, fontFamily: BRUSH, letterSpacing: '0.1em', marginRight: 6 }}>回収率</span>
                  <span style={{
                    fontSize: 16, fontWeight: 900, fontFamily: SANS,
                    color: recRate !== null ? (recRate >= 100 ? GOLD : RED) : SUB,
                  }}>
                    {recRate !== null ? `${recRate}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <OrnLine />

          {/* 今月のランキング */}
          <div style={{ flex: 1, padding: '12px 16px 0', minHeight: 0 }}>
            <SecHead>今月の戦場ランキング</SecHead>
            {ranking.length > 0 ? (
              <div style={{
                background: CARD, border: `1px solid ${GBRD}`,
                borderRadius: 10, padding: '2px 14px',
                boxShadow: `0 0 20px ${GOLD}0A`,
              }}>
                {ranking.slice(0, 3).map((item, i) => (
                  <RankRow key={item.label} item={item} rank={i + 1} />
                ))}
              </div>
            ) : (
              <div style={{
                background: CARD, border: `1px solid ${BDR}`, borderRadius: 10,
                padding: '18px', textAlign: 'center', fontSize: 13, color: SUB, fontFamily: BRUSH,
              }}>
                今月のデータがありません
              </div>
            )}
          </div>

          {/* nav 分の余白 */}
          <div style={{ height: NAV_H + FAB_H / 2 + 8, flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Floating Action Button ── */}
      <button
        onClick={onRecord}
        style={{
          position: 'fixed',
          bottom: NAV_H + 12,
          right: 20,
          width: FAB_H,
          height: FAB_H,
          borderRadius: '50%',
          background: `linear-gradient(135deg,${GOLDD},${GOLD} 50%,${GOLDB})`,
          color: '#0A0900',
          border: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          boxShadow: `0 4px 20px ${GOLD}70, 0 0 40px ${GOLD}30`,
          zIndex: 150,
          cursor: 'pointer',
        }}
        onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, fontFamily: BRUSH }}>◆</span>
        <span style={{ fontSize: 9, fontWeight: 900, fontFamily: BRUSH, letterSpacing: '0.05em' }}>記録</span>
      </button>
    </>
  );
}
