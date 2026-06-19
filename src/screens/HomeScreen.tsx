import { useState, useEffect, useCallback } from 'react';
import type { RankingItem } from '../storage';
import {
  getTotalProfit,
  getTodayProfit,
  getMonthProfit,
  getStoreRanking,
  getCategoryRanking,
  getWeekdayRanking,
  getMonthRanking,
  getYearRanking,
} from '../storage';
import type { RankingTab } from '../types';
import { RANKING_TAB_LABELS } from '../types';

interface Props {
  onRecord: () => void;
  refreshKey: number;
}

function formatYen(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  if (abs === 0) return '±0円';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(1).replace(/\.0$/, '')}億円`;
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    if (rem === 0) return `${sign}${man.toLocaleString()}万円`;
    return `${sign}${man.toLocaleString()}万${rem.toLocaleString()}円`;
  }
  return `${sign}${abs.toLocaleString()}円`;
}

function formatShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  if (abs === 0) return '±0';
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rem = abs % 10000;
    if (rem === 0) return `${sign}${man}万`;
    return `${sign}${man}万${rem.toLocaleString()}`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function RankingBar({ item, max, rank }: { item: RankingItem; max: number; rank: number }) {
  const pct = max === 0 ? 0 : Math.max(5, (Math.abs(item.profit) / max) * 100);
  const isProfit = item.profit >= 0;
  const rankColor = RANK_COLORS[rank - 1] || 'rgba(245,238,216,0.35)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 0',
      borderBottom: '1px solid rgba(255,215,0,0.07)',
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: `2px solid ${rankColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 900,
        color: rankColor,
        flexShrink: 0,
        fontFamily: 'sans-serif',
        background: rank <= 3 ? `${rankColor}18` : 'transparent',
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-main)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '58%',
            letterSpacing: '0.03em',
          }}>{item.label}</span>
          <span style={{
            fontSize: 16,
            fontWeight: 900,
            color: isProfit ? 'var(--profit)' : 'var(--loss)',
            fontFamily: 'sans-serif',
            textShadow: isProfit
              ? '0 0 12px rgba(0,232,122,0.5)'
              : '0 0 12px rgba(255,51,51,0.5)',
          }}>
            {formatShort(item.profit)}
          </span>
        </div>
        <div style={{
          height: 5,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: isProfit
              ? 'linear-gradient(90deg, #00E87A, #00FF99)'
              : 'linear-gradient(90deg, #FF3333, #FF6666)',
            borderRadius: 3,
            boxShadow: isProfit
              ? '0 0 6px rgba(0,232,122,0.6)'
              : '0 0 6px rgba(255,51,51,0.6)',
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: 2, display: 'block', fontFamily: 'sans-serif' }}>
          {item.count}戦
        </span>
      </div>
    </div>
  );
}

/* ── decorative separators ── */
function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      <span style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '0.1em', opacity: 0.7 }}>◆</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
    </div>
  );
}

export function HomeScreen({ onRecord, refreshKey }: Props) {
  const [activeTab, setActiveTab] = useState<RankingTab>('store');
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [month, setMonth] = useState(0);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  const refresh = useCallback(() => {
    setTotal(getTotalProfit());
    setToday(getTodayProfit());
    setMonth(getMonthProfit());
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  useEffect(() => {
    const map: Record<RankingTab, () => RankingItem[]> = {
      store: getStoreRanking,
      category: getCategoryRanking,
      weekday: getWeekdayRanking,
      month: getMonthRanking,
      year: getYearRanking,
    };
    setRanking(map[activeTab]());
  }, [activeTab, refreshKey]);

  const maxAbs = ranking.reduce((m, r) => Math.max(m, Math.abs(r.profit)), 0);
  const tabs: RankingTab[] = ['store', 'category', 'weekday', 'month', 'year'];

  const totalColor = total > 0 ? 'var(--gold)' : total < 0 ? 'var(--loss)' : 'rgba(245,238,216,0.4)';
  const totalGlow = total > 0
    ? '0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.25)'
    : total < 0
    ? '0 0 40px rgba(255,51,51,0.5), 0 0 80px rgba(255,51,51,0.2)'
    : 'none';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      overflowY: 'auto',
      paddingBottom: 88,
    }}>

      {/* ══ HEADER ══ */}
      <div style={{
        background: 'linear-gradient(180deg, #0a0020 0%, #080810 100%)',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        paddingBottom: 12,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* top gold accent line */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--red), var(--gold), var(--red))' }} />

        {/* diagonal decorative lines */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,215,0,0.03) 0px, rgba(255,215,0,0.03) 1px, transparent 1px, transparent 20px)',
        }} />

        <div style={{ padding: '14px 20px 6px', textAlign: 'center', position: 'relative' }}>
          {/* Corner decorations */}
          <span style={{ position: 'absolute', left: 16, top: 16, color: 'var(--red)', fontSize: 16, opacity: 0.8 }}>卍</span>
          <span style={{ position: 'absolute', right: 16, top: 16, color: 'var(--red)', fontSize: 16, opacity: 0.8 }}>卍</span>

          <div style={{
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: 'var(--gold)',
            textShadow: '0 0 30px rgba(255,215,0,0.7), 0 0 60px rgba(255,215,0,0.3), 2px 2px 0 rgba(120,80,0,0.8)',
            lineHeight: 1,
            fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
          }}>
            ゼニ帳
          </div>
          <div style={{
            fontSize: 11,
            letterSpacing: '0.35em',
            color: 'var(--gold)',
            opacity: 0.6,
            marginTop: 4,
            fontFamily: 'sans-serif',
          }}>
            ━ 戦績分析 ━
          </div>
        </div>
      </div>

      {/* ══ 生涯収支 HERO ══ */}
      <div style={{
        padding: '22px 20px 18px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 120% at 50% 60%, rgba(255,215,0,0.04) 0%, transparent 70%)',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: 'var(--gold)',
          marginBottom: 10,
          fontFamily: 'sans-serif',
          opacity: 0.8,
        }}>
          〔 生 涯 収 支 〕
        </div>

        <div style={{
          fontSize: total === 0 ? 44 : Math.abs(total) >= 10000000 ? 36 : Math.abs(total) >= 1000000 ? 46 : 58,
          fontWeight: 900,
          lineHeight: 1.05,
          color: totalColor,
          textShadow: totalGlow,
          letterSpacing: '-0.01em',
          fontFamily: '"Hiragino Kaku Gothic ProN", sans-serif',
          transition: 'color 0.4s, text-shadow 0.4s',
        }}>
          {formatYen(total)}
        </div>

        {/* glow ring behind number */}
        {total !== 0 && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200, height: 80,
            borderRadius: '50%',
            background: total > 0 ? 'rgba(255,215,0,0.06)' : 'rgba(255,51,51,0.06)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}
      </div>

      <GoldDivider />

      {/* ══ 今日 / 今月 ══ */}
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: '今日の収支', value: today },
          { label: '今月の収支', value: month },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 14px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* side accent */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
              background: value > 0 ? 'var(--profit)' : value < 0 ? 'var(--loss)' : 'var(--border)',
            }} />
            <div style={{
              fontSize: 10,
              color: 'var(--text-sub)',
              letterSpacing: '0.15em',
              marginBottom: 5,
              fontFamily: 'sans-serif',
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              color: value > 0 ? 'var(--profit)' : value < 0 ? 'var(--loss)' : 'var(--text-sub)',
              textShadow: value > 0
                ? '0 0 15px rgba(0,232,122,0.4)'
                : value < 0
                ? '0 0 15px rgba(255,51,51,0.4)'
                : 'none',
            }}>
              {formatShort(value)}
            </div>
          </div>
        ))}
      </div>

      {/* ══ RANKING ══ */}
      <div style={{ padding: '6px 16px 0', flex: 1 }}>
        {/* Section header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          padding: '10px 0 6px',
        }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, var(--red))' }} />
          <span style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            textShadow: '0 0 10px rgba(255,215,0,0.5)',
          }}>
            ◆ 戦績ランキング ◆
          </span>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, var(--red), transparent)' }} />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 12,
          paddingBottom: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'sans-serif',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
                background: activeTab === tab
                  ? 'linear-gradient(135deg, #CC2200, #FF4400)'
                  : 'var(--bg-card)',
                color: activeTab === tab ? '#FFF5A0' : 'var(--text-sub)',
                border: activeTab === tab
                  ? '1px solid rgba(255,100,0,0.5)'
                  : '1px solid var(--border)',
                boxShadow: activeTab === tab ? '0 0 12px rgba(204,34,0,0.4)' : 'none',
              }}
            >
              {RANKING_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {ranking.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-sub)',
          }}>
            <div style={{
              fontSize: 36,
              color: 'rgba(255,215,0,0.2)',
              marginBottom: 12,
              fontFamily: 'serif',
              letterSpacing: '0.1em',
            }}>
              無記録
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.1em', fontFamily: 'sans-serif' }}>
              戦績を記録して分析を始めよう
            </div>
          </div>
        ) : (
          <div>
            {ranking.map((item, i) => (
              <RankingBar key={item.label} item={item} max={maxAbs} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* ══ FLOATING BUTTON ══ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '16px 16px 28px',
        background: 'linear-gradient(transparent, #080810 50%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 6,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.2em',
            background: 'linear-gradient(135deg, #B22200 0%, #FF3300 40%, #FFD700 100%)',
            color: '#FFF5A0',
            boxShadow: '0 4px 24px rgba(200,50,0,0.5), 0 0 40px rgba(255,100,0,0.2), inset 0 1px 0 rgba(255,255,200,0.2)',
            pointerEvents: 'all',
            border: '1px solid rgba(255,200,0,0.3)',
            fontFamily: '"Hiragino Mincho ProN", serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(200,50,0,0.4)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(200,50,0,0.5), 0 0 40px rgba(255,100,0,0.2)'; }}
        >
          ◆ 記録する ◆
        </button>
      </div>
    </div>
  );
}
