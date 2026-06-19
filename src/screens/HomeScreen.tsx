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
const GOLD   = '#D4AF37';
const GOLD2  = '#F5D97A';   // lighter gold for hero number
const RED    = '#B52A1A';
const BG     = '#0A0A0A';
const CARD   = '#111111';
const BORDER = '#1C1C1C';
const BORDER2= '#2A2200';   // warm gold-tinted border
const TEXT   = '#EDE4C8';
const SUB    = '#4A4A4A';
const MEDAL  = ['#D4AF37', '#9AA0A6', '#A0785A'];

function ProfitNum({ value, size = 52 }: { value: number; size?: number }) {
  const color = value > 0 ? GOLD2 : value < 0 ? RED : SUB;
  return (
    <span style={{ fontSize: size, fontWeight: 900, fontFamily: 'sans-serif', color, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {formatAmountFull(value)}
    </span>
  );
}

function Divider() {
  return (
    <div style={{ margin: '0 16px', height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)` }} />
  );
}

function RankRow({ item, rank }: { item: RankingItem; rank: number }) {
  const medal = MEDAL[rank - 1];
  const isPos = item.profit >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: rank < 3 ? `1px solid ${BORDER}` : 'none' }}>
      {/* Medal */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${medal}`,
        background: `${medal}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 900, color: medal, fontFamily: 'sans-serif',
      }}>
        {rank}位
      </div>
      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </div>
        <div style={{ fontSize: 10, color: SUB, fontFamily: 'sans-serif', marginTop: 2 }}>
          {item.count}戦
        </div>
      </div>
      {/* Profit */}
      <div style={{ fontSize: 17, fontWeight: 900, fontFamily: 'sans-serif', flexShrink: 0,
        color: isPos ? (rank === 1 ? GOLD2 : GOLD) : RED }}>
        {formatAmount(item.profit)}
      </div>
    </div>
  );
}

export function HomeScreen({ onRecord, refreshKey }: Props) {
  const now = new Date();
  const [total, setTotal]       = useState(0);
  const [month, setMonth]       = useState(0);
  const [summary, setSummary]   = useState({ winDays: 0, lossDays: 0, evenDays: 0, recoveryRate: null as number | null });
  const [ranking, setRanking]   = useState<RankingItem[]>([]);

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
    <div style={{ height: '100dvh', overflowY: 'auto', paddingBottom: NAV_H + 8, background: BG }}>

      {/* ── Header ── */}
      <div style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
        {/* Accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${RED}, ${GOLD}, ${RED})` }} />
        <div style={{ padding: '16px 20px 14px', textAlign: 'center' }}>
          <div style={{
            fontSize: 40, fontWeight: 900, letterSpacing: '0.15em',
            color: GOLD,
            fontFamily: '"Hiragino Mincho ProN","Yu Mincho",serif',
          }}>
            ゼニ帳
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: SUB, marginTop: 2, fontFamily: 'sans-serif' }}>
            ━ 戦 績 管 理 ━
          </div>
        </div>
      </div>

      {/* ── 生涯収支 ── */}
      <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.5em', color: SUB, marginBottom: 10, fontFamily: 'sans-serif' }}>
          〔 生 涯 収 支 〕
        </div>
        <ProfitNum value={total} size={Math.abs(total) >= 10000000 ? 40 : 56} />
      </div>

      <Divider />

      {/* ── 今月成績 ── */}
      <div style={{ padding: '16px 16px 14px' }}>
        <div style={{ fontSize: 11, color: SUB, letterSpacing: '0.2em', marginBottom: 12, fontFamily: 'sans-serif' }}>
          {now.getMonth() + 1}月の成績
        </div>
        {/* Big month number */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <ProfitNum value={month} size={42} />
        </div>
        {/* Stat row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '勝ち',   value: `${summary.winDays}日`,  color: GOLD },
            { label: '負け',   value: `${summary.lossDays}日`, color: RED  },
            { label: '回収率', value: recRate !== null ? `${recRate}%` : '—',
              color: recRate !== null ? (recRate >= 100 ? GOLD : RED) : SUB },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 8, padding: '10px 0', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: SUB, marginBottom: 5, fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
                {label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'sans-serif', color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── 今月のランキング ── */}
      <div style={{ padding: '16px 16px 14px' }}>
        <div style={{ fontSize: 11, color: SUB, letterSpacing: '0.2em', marginBottom: 2, fontFamily: 'sans-serif' }}>
          今月の戦場ランキング
        </div>
        {ranking.length > 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '4px 14px' }}>
            {ranking.slice(0, 3).map((item, i) => (
              <RankRow key={item.label} item={item} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '20px', textAlign: 'center', fontSize: 13, color: SUB, fontFamily: 'sans-serif' }}>
            今月のデータがありません
          </div>
        )}
      </div>

      <Divider />

      {/* ── 記録する ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%', padding: '18px',
            borderRadius: 8, fontSize: 17, fontWeight: 900, letterSpacing: '0.3em',
            background: GOLD, color: '#0A0A0A',
            border: 'none', fontFamily: '"Hiragino Mincho ProN","Yu Mincho",serif',
          }}
          onTouchStart={e => { e.currentTarget.style.opacity = '0.85'; }}
          onTouchEnd={e => { e.currentTarget.style.opacity = '1'; }}
        >
          ◆ 記録する ◆
        </button>
      </div>

    </div>
  );
}
