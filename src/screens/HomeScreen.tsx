import { useEffect, useState, useCallback } from 'react';
import type { RankingItem } from '../storage';
import {
  getTotalProfit, getMonthProfit, getMonthSummary,
  getMonthStoreRanking, formatAmount,
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

function ZeniAmt({ value, size }: { value: number; size: number }) {
  const c = profitColor(value);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: size, fontWeight: 800, fontFamily: BRUSH, color: c, lineHeight: 1 }}>
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
      {/* Medal badge */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${medal}`, background: `${medal}14`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: medal, fontFamily: BRUSH,
      }}>
        {rank}位
      </div>
      {/* Name & battle count */}
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
      {/* Amount */}
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
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: '#0A0905',
    }}>

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

      {/* ── コンテンツ ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '4px 0' }}>

        {/* ① 生涯収支 */}
        <div style={{
          textAlign: 'center', padding: '0 20px',
          background: 'radial-gradient(ellipse at 50% 50%,rgba(201,162,39,0.07) 0%,transparent 70%)',
        }}>
          <div style={{
            fontSize: 11, letterSpacing: '0.6em', color: `${GOLDB}BB`,
            fontFamily: BRUSH, fontWeight: 700, marginBottom: 8,
          }}>
            生 涯 収 支
          </div>
          <ZeniAmt value={total} size={Math.abs(total) >= 10000000 ? 42 : 54} />
        </div>

        <Divider />

        {/* ② 今月の収支 */}
        <div style={{ padding: '0 16px' }}>
          <SectionTitle>{now.getMonth() + 1}月の収支</SectionTitle>

          {/* 月間合計 */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <ZeniAmt value={month} size={38} />
          </div>

          {/* ステータス 3カード */}
          <div style={{ display: 'flex', gap: 8 }}>
            <StatCard
              label="勝ち日"
              value={`${summary.winDays}日`}
              color={GOLD}
            />
            <StatCard
              label="負け日"
              value={`${summary.lossDays}日`}
              color={RED}
            />
            <StatCard
              label="回収率"
              value={recRate !== null ? `${recRate}%` : '—'}
              color={recRate !== null ? (recRate >= 100 ? GOLD : RED) : SUB}
            />
          </div>
        </div>

        <Divider />

        {/* ③ 今月の戦場ランキング */}
        <div style={{ padding: '0 16px' }}>
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

      </div>

      {/* nav 分のスペーサー */}
      <div style={{ height: NAV_H, flexShrink: 0 }} />
    </div>
  );
}
