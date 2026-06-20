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

const NAV_H  = 60;
const GOLD   = '#C9A227';
const GOLDB  = '#F0CC55';
const RED    = '#9B1C10';
const CARD   = '#0F0E0A';
const BORDER = '#1E1C10';
const GBRD   = 'rgba(201,162,39,0.22)';
const TEXT   = '#EDE3C0';
const SUB    = '#50493A';
const BRUSH  = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
const MEDAL  = ['#C9A227', '#9AA0A6', '#9C6E3C'];

function OrnDivider({ tight }: { tight?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: tight ? '0 16px' : '2px 16px',
    }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}30)` }} />
      <span style={{ color: `${GOLD}60`, fontSize: 10 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${GOLD}30,transparent)` }} />
    </div>
  );
}

function RankRow({ item, rank }: { item: RankingItem; rank: number }) {
  const medal = MEDAL[rank - 1] ?? SUB;
  const isPos = item.profit >= 0;
  const isFirst = rank === 1;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0',
      borderBottom: rank < 3 ? `1px solid ${BORDER}` : 'none',
      background: isFirst ? `radial-gradient(ellipse at 0% 50%, ${GOLD}08 0%, transparent 70%)` : 'transparent',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${medal}`,
        background: `${medal}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: medal, fontFamily: BRUSH,
      }}>
        {rank}位
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: isFirst ? TEXT : `${TEXT}CC`,
          fontFamily: BRUSH, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
        <div style={{ fontSize: 10, color: SUB, fontFamily: 'sans-serif', marginTop: 2 }}>
          {item.count}戦
        </div>
      </div>
      <div style={{
        fontSize: isFirst ? 19 : 16, fontWeight: 900, fontFamily: 'sans-serif', flexShrink: 0,
        color: isPos ? (isFirst ? GOLDB : GOLD) : RED,
        textShadow: isFirst && isPos ? `0 0 18px ${GOLD}66` : 'none',
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
    <div style={{ height: '100dvh', overflowY: 'auto', paddingBottom: NAV_H + 8, background: '#09090700' }}>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(180deg,#0D0C08 0%,#0A0905 100%)', borderBottom: `1px solid ${BORDER}` }}>
        {/* Top stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
        <div style={{ padding: '18px 20px 16px', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{
            fontSize: 48, fontWeight: 800,
            letterSpacing: '0.18em',
            color: GOLD,
            fontFamily: BRUSH,
            textShadow: `0 2px 20px ${GOLD}55, 0 0 60px ${GOLD}22`,
            lineHeight: 1,
          }}>
            ゼニ帳
          </div>
          {/* Subtitle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginTop: 8,
          }}>
            <div style={{ width: 28, height: 1, background: `${GOLD}40` }} />
            <span style={{ fontSize: 10, letterSpacing: '0.4em', color: `${GOLD}70`, fontFamily: BRUSH }}>
              戦績管理
            </span>
            <div style={{ width: 28, height: 1, background: `${GOLD}40` }} />
          </div>
        </div>
      </div>

      {/* ── 生涯収支 ── */}
      <div style={{
        padding: '26px 20px 22px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.07) 0%, transparent 70%)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.6em', color: `${GOLD}80`, marginBottom: 10, fontFamily: BRUSH }}>
          〔 生 涯 収 支 〕
        </div>
        <div style={{
          fontSize: total === 0 ? 46 : Math.abs(total) >= 10000000 ? 38 : 58,
          fontWeight: 900, lineHeight: 1, color: totalColor,
          fontFamily: 'sans-serif', letterSpacing: '-0.02em',
          textShadow: total !== 0 ? `0 0 40px ${totalColor}55` : 'none',
        }}>
          {formatAmountFull(total)}
        </div>
      </div>

      <OrnDivider />

      {/* ── 今月の成績 ── */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: `${GOLD}80`, marginBottom: 12, fontFamily: BRUSH }}>
          ◇ {now.getMonth() + 1}月の成績
        </div>
        {/* Month total */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{
            fontSize: 40, fontWeight: 900, color: monthColor,
            fontFamily: 'sans-serif', letterSpacing: '-0.02em',
            textShadow: month !== 0 ? `0 0 24px ${monthColor}55` : 'none',
          }}>
            {formatAmountFull(month)}
          </div>
        </div>
        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { label: '勝ち日',   value: `${summary.winDays}日`,  color: GOLD },
            { label: '負け日',   value: `${summary.lossDays}日`, color: RED  },
            { label: '回収率',
              value: recRate !== null ? `${recRate}%` : '—',
              color: recRate !== null ? (recRate >= 100 ? GOLD : RED) : SUB },
          ] as { label: string; value: string; color: string }[]).map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '10px 0', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: SUB, marginBottom: 5, fontFamily: BRUSH, letterSpacing: '0.1em' }}>
                {label}
              </div>
              <div style={{ fontSize: 19, fontWeight: 900, fontFamily: 'sans-serif', color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OrnDivider />

      {/* ── 今月の戦場ランキング ── */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: `${GOLD}80`, marginBottom: 12, fontFamily: BRUSH }}>
          ◇ 今月の戦場ランキング
        </div>
        {ranking.length > 0 ? (
          <div style={{
            background: CARD, border: `1px solid ${GBRD}`,
            borderRadius: 10, padding: '4px 14px',
            boxShadow: `0 0 24px ${GOLD}0A`,
          }}>
            {ranking.slice(0, 3).map((item, i) => (
              <RankRow key={item.label} item={item} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '20px', textAlign: 'center', fontSize: 13, color: SUB, fontFamily: BRUSH,
          }}>
            今月のデータがありません
          </div>
        )}
      </div>

      <OrnDivider />

      {/* ── 記録する ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%', padding: '18px',
            borderRadius: 6, fontSize: 18, fontWeight: 800,
            letterSpacing: '0.35em',
            background: `linear-gradient(135deg,#A07B10 0%,${GOLD} 40%,${GOLDB} 60%,${GOLD} 100%)`,
            color: '#0A0900',
            border: 'none',
            fontFamily: BRUSH,
            boxShadow: `0 4px 28px ${GOLD}40`,
          }}
          onTouchStart={e => { e.currentTarget.style.filter = 'brightness(0.88)'; }}
          onTouchEnd={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          ◆ 記録する ◆
        </button>
      </div>
    </div>
  );
}
