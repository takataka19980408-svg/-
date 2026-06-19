import { useEffect, useState } from 'react';
import type { RankingItem, DayData } from '../storage';
import {
  getDailyDataForMonth, getMonthSummary, getCategoryRanking,
  getWeekdayRanking, formatAmount,
} from '../storage';

interface Props { refreshKey: number; }

type AnalysisTab = 'monthly' | 'category' | 'weekday';
const NAV_H = 60;

// ── Daily bar chart (vertical, scrollable) ───────────────────
function DailyBarChart({ data }: { data: DayData[] }) {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  const HALF = 72;
  const BAR_W = 14;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as const }}>
      <div style={{
        display: 'flex',
        gap: 2,
        height: HALF * 2 + 26,
        minWidth: data.length * (BAR_W + 2),
        position: 'relative',
        alignItems: 'stretch',
      }}>
        {/* center baseline */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: HALF,
          height: 1, background: 'rgba(255,215,0,0.2)', pointerEvents: 'none',
        }} />
        {data.map(({ day, profit, count }) => {
          const barH = profit === 0 ? 0 : Math.max(3, (Math.abs(profit) / maxAbs) * HALF);
          const isPos = profit > 0;
          const hasData = count > 0;
          return (
            <div key={day} style={{ width: BAR_W, flexShrink: 0, display: 'flex', flexDirection: 'column', height: HALF * 2 + 26 }}>
              {/* upper half */}
              <div style={{ height: HALF, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {isPos && (
                  <div style={{
                    height: barH, width: '100%',
                    background: 'linear-gradient(180deg,var(--gold),rgba(255,215,0,0.5))',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </div>
              {/* lower half */}
              <div style={{ height: HALF, display: 'flex', flexDirection: 'column' }}>
                {!isPos && profit !== 0 && (
                  <div style={{
                    height: barH, width: '100%',
                    background: 'linear-gradient(180deg,rgba(255,51,51,0.5),var(--loss))',
                    borderRadius: '0 0 2px 2px',
                  }} />
                )}
              </div>
              {/* day label */}
              <div style={{
                height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: hasData ? 'var(--text-sub)' : 'rgba(245,238,216,0.2)',
                fontFamily: 'sans-serif',
              }}>
                {day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Horizontal bar chart ─────────────────────────────────────
function HBarChart({ items }: { items: RankingItem[] }) {
  if (items.length === 0) {
    return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-sub)', fontSize: 13, fontFamily: 'sans-serif' }}>データなし</div>;
  }
  const maxAbs = Math.max(...items.map(i => Math.abs(i.profit)), 1);
  return (
    <div>
      {items.map((item, idx) => {
        const pct = (Math.abs(item.profit) / maxAbs) * 100;
        const isPos = item.profit >= 0;
        return (
          <div key={item.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: idx < 3 ? 'var(--text-main)' : 'var(--text-sub)' }}>
                {item.label}
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: 14, fontWeight: 900, fontFamily: 'sans-serif',
                  color: isPos ? 'var(--profit)' : 'var(--loss)',
                }}>
                  {formatAmount(item.profit)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-sub)', marginLeft: 4, fontFamily: 'sans-serif' }}>
                  {item.count}回
                </span>
              </div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: isPos
                  ? 'linear-gradient(90deg,var(--gold),rgba(255,215,0,0.5))'
                  : 'linear-gradient(90deg,var(--loss),rgba(255,51,51,0.5))',
                borderRadius: 3, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stat cards ───────────────────────────────────────────────
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-sub)', marginBottom: 4, fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'sans-serif', color: color ?? 'var(--text-main)' }}>{value}</div>
    </div>
  );
}

export function AnalysisScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<AnalysisTab>('monthly');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [summary, setSummary] = useState({ winDays: 0, lossDays: 0, evenDays: 0, totalIn: 0, totalOut: 0, recoveryRate: null as number | null });
  const [catItems, setCatItems] = useState<RankingItem[]>([]);
  const [wdItems, setWdItems] = useState<RankingItem[]>([]);

  useEffect(() => {
    setDailyData(getDailyDataForMonth(year, month));
    setSummary(getMonthSummary(year, month));
  }, [year, month, refreshKey]);

  useEffect(() => {
    setCatItems(getCategoryRanking());
    setWdItems(getWeekdayRanking());
  }, [refreshKey]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const tabs: { id: AnalysisTab; label: string }[] = [
    { id: 'monthly', label: '月別' },
    { id: 'category', label: '種目別' },
    { id: 'weekday', label: '曜日別' },
  ];

  const monthlyProfit = dailyData.reduce((s, d) => s + d.profit, 0);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 0', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--gold)', textShadow: '0 0 16px rgba(255,215,0,0.4)', fontFamily: '"Hiragino Mincho ProN",serif', marginBottom: 10 }}>
            戦績分析
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(255,215,0,0.1)' }}>
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700,
                  fontFamily: 'sans-serif', letterSpacing: '0.05em',
                  background: 'transparent', border: 'none',
                  color: tab === id ? 'var(--gold)' : 'var(--text-sub)',
                  borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>

        {/* Monthly tab */}
        {tab === 'monthly' && (
          <div>
            {/* Month navigator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14, background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px',
              border: '1px solid var(--border)',
            }}>
              <button onClick={prevMonth} style={{ fontSize: 18, color: 'var(--gold)', padding: '0 8px', fontWeight: 700 }}>‹</button>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', fontFamily: 'sans-serif' }}>
                {year}年{month}月
              </span>
              <button onClick={nextMonth} style={{ fontSize: 18, color: 'var(--gold)', padding: '0 8px', fontWeight: 700 }}>›</button>
            </div>

            {/* Monthly total */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--text-sub)', letterSpacing: '0.2em', fontFamily: 'sans-serif' }}>月間収支 </span>
              <span style={{
                fontSize: 24, fontWeight: 900, fontFamily: 'sans-serif',
                color: monthlyProfit > 0 ? 'var(--gold)' : monthlyProfit < 0 ? 'var(--loss)' : 'var(--text-sub)',
              }}>
                {formatAmount(monthlyProfit)}
              </span>
            </div>

            {/* Bar chart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 10px', marginBottom: 14 }}>
              <DailyBarChart data={dailyData} />
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <StatRow label="勝ち" value={`${summary.winDays}日`} color="var(--profit)" />
              <StatRow label="負け" value={`${summary.lossDays}日`} color="var(--loss)" />
              <StatRow label="引き分け" value={`${summary.evenDays}日`} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatRow
                label="回収率"
                value={summary.recoveryRate !== null ? `${summary.recoveryRate}%` : '—'}
                color={summary.recoveryRate !== null ? (summary.recoveryRate >= 100 ? 'var(--profit)' : 'var(--loss)') : undefined}
              />
              <StatRow label="総投資" value={summary.totalIn > 0 ? `${formatAmount(summary.totalIn)}` : '—'} />
              <StatRow label="総回収" value={summary.totalOut > 0 ? `${formatAmount(summary.totalOut)}` : '—'} />
            </div>
          </div>
        )}

        {/* Category tab */}
        {tab === 'category' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 12, borderLeft: '3px solid var(--red)', paddingLeft: 8 }}>
              種目別 収支ランキング（全期間）
            </div>
            <HBarChart items={catItems} />
          </div>
        )}

        {/* Weekday tab */}
        {tab === 'weekday' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 12, borderLeft: '3px solid var(--red)', paddingLeft: 8 }}>
              曜日別 収支ランキング（全期間）
            </div>
            <HBarChart items={wdItems} />
          </div>
        )}
      </div>
    </div>
  );
}
