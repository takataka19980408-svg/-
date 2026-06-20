import { useEffect, useState, useMemo, useRef } from 'react';
import type { GamblingRecord } from '../types';
import { CATEGORY_LABELS } from '../types';
import type { RankingItem, DayData } from '../storage';
import {
  getDailyDataForMonth, getMonthSummary, getCategoryRanking,
  getWeekdayRanking, getRecords, formatAmount,
} from '../storage';

interface Props { refreshKey: number; }

type AnalysisTab = 'monthly' | 'category' | 'weekday';
const NAV_H = 60;

// ── Daily bar chart ───────────────────────────────────────────
function DailyBarChart({
  data,
  selectedDay,
  onDayClick,
}: {
  data: DayData[];
  selectedDay: number | null;
  onDayClick: (day: number) => void;
}) {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  const HALF  = 72;
  const BAR_W = 16;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as const }}>
      <div style={{
        display: 'flex', gap: 2,
        height: HALF * 2 + 26,
        minWidth: data.length * (BAR_W + 2),
        position: 'relative', alignItems: 'stretch',
      }}>
        {/* baseline */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: HALF,
          height: 1, background: 'rgba(255,215,0,0.2)', pointerEvents: 'none',
        }} />

        {data.map(({ day, profit, count }) => {
          const barH    = profit === 0 ? 0 : Math.max(3, (Math.abs(profit) / maxAbs) * HALF);
          const isPos   = profit > 0;
          const hasData = count > 0;
          const isSel   = selectedDay === day;

          return (
            <div
              key={day}
              onClick={() => hasData && onDayClick(isSel ? -1 : day)}
              style={{
                width: BAR_W, flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                height: HALF * 2 + 26,
                cursor: hasData ? 'pointer' : 'default',
                borderRadius: 3,
                background: isSel ? 'rgba(201,162,39,0.1)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* upper half — positive bars grow upward */}
              <div style={{ height: HALF, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {isPos && (
                  <div style={{
                    height: barH, width: '100%',
                    background: isSel
                      ? 'linear-gradient(180deg,#F5D060,#C9A227)'
                      : 'linear-gradient(180deg,var(--gold),rgba(255,215,0,0.5))',
                    borderRadius: '2px 2px 0 0',
                    boxShadow: isSel ? '0 0 6px rgba(201,162,39,0.6)' : 'none',
                  }} />
                )}
              </div>
              {/* lower half — negative bars grow downward */}
              <div style={{ height: HALF, display: 'flex', flexDirection: 'column' }}>
                {!isPos && profit !== 0 && (
                  <div style={{
                    height: barH, width: '100%',
                    background: isSel
                      ? 'linear-gradient(180deg,#FF3300,rgba(155,28,16,0.8))'
                      : 'linear-gradient(180deg,rgba(255,51,51,0.5),var(--loss))',
                    borderRadius: '0 0 2px 2px',
                    boxShadow: isSel ? '0 0 6px rgba(255,51,51,0.5)' : 'none',
                  }} />
                )}
              </div>
              {/* day label */}
              <div style={{
                height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9,
                color: isSel
                  ? 'rgba(201,162,39,0.9)'
                  : hasData ? 'var(--text-sub)' : 'rgba(245,238,216,0.2)',
                fontFamily: 'sans-serif',
                fontWeight: isSel ? 700 : 400,
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

// ── Day detail panel ──────────────────────────────────────────
function DayDetail({
  records, month, day, onClose,
}: {
  records: GamblingRecord[];
  month: number; day: number;
  onClose: () => void;
}) {
  const dayProfit = records.reduce((s, r) => s + r.profit, 0);

  return (
    <div style={{
      margin: '10px 0',
      background: '#0F0E0A',
      border: '1px solid rgba(201,162,39,0.3)',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(201,162,39,0.07)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        background: 'rgba(201,162,39,0.06)',
        borderBottom: '1px solid rgba(201,162,39,0.15)',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: 'var(--gold)', fontFamily: 'var(--font-brush, sans-serif)',
          letterSpacing: '0.05em',
        }}>
          {month}月{day}日
        </span>
        <span style={{
          fontSize: 14, fontWeight: 800,
          color: dayProfit > 0 ? 'var(--gold)' : dayProfit < 0 ? 'var(--loss)' : 'var(--text-sub)',
          fontFamily: 'sans-serif',
        }}>
          {formatAmount(dayProfit)}
        </span>
        <button
          onClick={onClose}
          style={{
            fontSize: 16, color: 'rgba(245,238,216,0.4)',
            background: 'none', border: 'none', cursor: 'pointer',
            lineHeight: 1, padding: '0 2px',
          }}
        >
          ×
        </button>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-sub)', fontSize: 13, fontFamily: 'sans-serif' }}>
          記録なし
        </div>
      ) : (
        records.map((r, i) => (
          <div key={r.id} style={{
            padding: '10px 14px',
            borderBottom: i < records.length - 1 ? '1px solid rgba(255,215,0,0.07)' : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text-main)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'sans-serif',
                }}>
                  {r.storeName}
                </span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                  background: 'rgba(201,162,39,0.12)',
                  border: '1px solid rgba(201,162,39,0.25)',
                  color: 'var(--gold)', fontFamily: 'sans-serif',
                }}>
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>
                IN ¥{r.inAmount.toLocaleString()}　→　OUT ¥{r.outAmount.toLocaleString()}
              </div>
              {r.memo && (
                <div style={{ fontSize: 11, color: 'rgba(245,238,216,0.5)', marginTop: 2, fontFamily: 'sans-serif', fontStyle: 'italic' }}>
                  {r.memo}
                </div>
              )}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 900, fontFamily: 'sans-serif', flexShrink: 0,
              color: r.profit > 0 ? 'var(--gold)' : r.profit < 0 ? 'var(--loss)' : 'var(--text-sub)',
            }}>
              {formatAmount(r.profit)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────
function HBarChart({ items }: { items: RankingItem[] }) {
  if (items.length === 0) {
    return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-sub)', fontSize: 13, fontFamily: 'sans-serif' }}>データなし</div>;
  }
  const maxAbs = Math.max(...items.map(i => Math.abs(i.profit)), 1);
  return (
    <div>
      {items.map((item, idx) => {
        const pct   = (Math.abs(item.profit) / maxAbs) * 100;
        const isPos = item.profit >= 0;
        return (
          <div key={item.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: idx < 3 ? 'var(--text-main)' : 'var(--text-sub)' }}>
                {item.label}
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'sans-serif', color: isPos ? 'var(--profit)' : 'var(--loss)' }}>
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

// ── Stat cards ────────────────────────────────────────────────
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

// ── Month scroller ────────────────────────────────────────────
function MonthScroller({
  year, month, onChange,
}: {
  year: number; month: number;
  onChange: (y: number, m: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build list: 36 months back → 2 months ahead
  const list = useMemo(() => {
    const now  = new Date();
    const rows: { year: number; month: number; showYear: boolean }[] = [];
    for (let i = -35; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const showYear = m === 1 || i === -35;
      rows.push({ year: y, month: m, showYear });
    }
    return rows;
  }, []);

  // Scroll selected month into centre on first render and when selection changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const selected = el.querySelector<HTMLElement>('[data-sel="1"]');
    if (selected) {
      const offset = selected.offsetLeft - el.clientWidth / 2 + selected.clientWidth / 2;
      el.scrollLeft = offset;
    }
  }, [year, month]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6,
        WebkitOverflowScrolling: 'touch' as const,
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
      }}
    >
      {list.map(item => {
        const isSel = item.year === year && item.month === month;
        return (
          <div key={`${item.year}-${item.month}`} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Year label above first month of each year */}
            <div style={{ fontSize: 8, color: item.showYear ? 'rgba(201,162,39,0.5)' : 'transparent', fontFamily: 'sans-serif', height: 12, lineHeight: '12px' }}>
              {item.year}
            </div>
            <button
              data-sel={isSel ? '1' : '0'}
              onClick={() => onChange(item.year, item.month)}
              style={{
                minWidth: 44, padding: '6px 10px',
                borderRadius: 6,
                fontSize: 13, fontWeight: isSel ? 800 : 400,
                fontFamily: 'sans-serif',
                background: isSel ? 'rgba(201,162,39,0.15)' : 'transparent',
                border: isSel ? '1px solid rgba(201,162,39,0.55)' : '1px solid rgba(255,255,255,0.07)',
                color: isSel ? '#F5D060' : 'rgba(245,238,216,0.45)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {item.month}月
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────
export function AnalysisScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<AnalysisTab>('monthly');
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [summary,   setSummary]   = useState({
    winDays: 0, lossDays: 0, evenDays: 0,
    totalIn: 0, totalOut: 0, recoveryRate: null as number | null,
  });
  const [catItems, setCatItems] = useState<RankingItem[]>([]);
  const [wdItems,  setWdItems]  = useState<RankingItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayDetailRef    = useRef<HTMLDivElement>(null);
  const scrollAreaRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDailyData(getDailyDataForMonth(year, month));
    setSummary(getMonthSummary(year, month));
    setSelectedDay(null);
  }, [year, month, refreshKey]);

  useEffect(() => {
    setCatItems(getCategoryRanking());
    setWdItems(getWeekdayRanking());
  }, [refreshKey]);

  // Records for selected day
  const dayRecords = useMemo<GamblingRecord[]>(() => {
    if (selectedDay === null) return [];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return getRecords().filter(r => r.date === dateStr);
  }, [selectedDay, year, month, refreshKey]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day === -1 ? null : day);
  };

  // Scroll day detail into view, accounting for the fixed nav bar
  useEffect(() => {
    if (selectedDay === null || !dayDetailRef.current || !scrollAreaRef.current) return;
    requestAnimationFrame(() => {
      const el        = dayDetailRef.current!;
      const container = scrollAreaRef.current!;
      // Visible bottom = container bottom edge minus the fixed nav height
      const visibleBottom = container.getBoundingClientRect().bottom - NAV_H - 8;
      const elBottom      = el.getBoundingClientRect().bottom;
      if (elBottom > visibleBottom) {
        container.scrollBy({ top: elBottom - visibleBottom, behavior: 'smooth' });
      }
    });
  }, [selectedDay]);

  const tabs: { id: AnalysisTab; label: string }[] = [
    { id: 'monthly',  label: '月別'  },
    { id: 'category', label: '種目別' },
    { id: 'weekday',  label: '曜日別' },
  ];

  const monthlyProfit = dailyData.reduce((s, d) => s + d.profit, 0);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 0', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <div style={{
            fontSize: 17, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--gold)',
            textShadow: '0 0 16px rgba(255,215,0,0.4)',
            fontFamily: '"Hiragino Mincho ProN",serif', marginBottom: 10,
          }}>
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
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollAreaRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>

        {/* ── Monthly tab ── */}
        {tab === 'monthly' && (
          <div style={{ paddingBottom: 24 }}>
            {/* Month scroller */}
            <div style={{ marginBottom: 14 }}>
              <MonthScroller year={year} month={month} onChange={handleMonthChange} />
            </div>

            {/* Monthly total */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--text-sub)', letterSpacing: '0.2em', fontFamily: 'sans-serif' }}>
                {year}年{month}月　月間収支
              </span>
              <span style={{
                fontSize: 24, fontWeight: 900, fontFamily: 'sans-serif',
                color: monthlyProfit > 0 ? 'var(--gold)' : monthlyProfit < 0 ? 'var(--loss)' : 'var(--text-sub)',
              }}>
                {formatAmount(monthlyProfit)}
              </span>
            </div>

            {/* Bar chart */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 10px', marginBottom: 4,
            }}>
              <DailyBarChart
                data={dailyData}
                selectedDay={selectedDay}
                onDayClick={handleDayClick}
              />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(245,238,216,0.25)', textAlign: 'center', marginBottom: 10, fontFamily: 'sans-serif' }}>
              棒グラフをタップするとその日の記録を表示
            </div>

            {/* Day detail panel */}
            {selectedDay !== null && (
              <div ref={dayDetailRef}>
                <DayDetail
                  records={dayRecords}
                  month={month}
                  day={selectedDay}
                  onClose={() => setSelectedDay(null)}
                />
              </div>
            )}

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
              <StatRow label="総投資" value={summary.totalIn > 0 ? formatAmount(summary.totalIn) : '—'} />
              <StatRow label="総回収" value={summary.totalOut > 0 ? formatAmount(summary.totalOut) : '—'} />
            </div>
          </div>
        )}

        {/* ── Category tab ── */}
        {tab === 'category' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 12, borderLeft: '3px solid var(--red)', paddingLeft: 8 }}>
              種目別 収支ランキング（全期間）
            </div>
            <HBarChart items={catItems} />
          </div>
        )}

        {/* ── Weekday tab ── */}
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
