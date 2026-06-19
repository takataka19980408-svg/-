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
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  if (abs === 0) return '±0円';
  if (abs >= 100000000) {
    return `${sign}${(abs / 100000000).toFixed(1).replace(/\.0$/, '')}億円`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remainder = abs % 10000;
    if (remainder === 0) return `${sign}${man.toLocaleString()}万円`;
    return `${sign}${man.toLocaleString()}万${remainder.toLocaleString()}円`;
  }
  return `${sign}${abs.toLocaleString()}円`;
}

function formatShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  if (abs === 0) return '±0';
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const remainder = abs % 10000;
    if (remainder === 0) return `${sign}${man}万`;
    return `${sign}${man}万${remainder.toLocaleString()}`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

function RankingBar({ item, max, rank }: { item: RankingItem; max: number; rank: number }) {
  const pct = max === 0 ? 0 : Math.max(4, Math.abs(item.profit / max) * 100);
  const isProfit = item.profit >= 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,215,0,0.08)',
    }}>
      <span style={{
        width: 24,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: rank === 1 ? 'var(--gold)' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-sub)',
        flexShrink: 0,
      }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-main)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '60%',
          }}>{item.label}</span>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: isProfit ? 'var(--profit)' : 'var(--loss)',
            flexShrink: 0,
          }}>
            {formatShort(item.profit)}
          </span>
        </div>
        <div style={{
          height: 4,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: isProfit
              ? 'linear-gradient(90deg, var(--profit), #27ae60)'
              : 'linear-gradient(90deg, var(--loss), #c0392b)',
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2, display: 'block' }}>
          {item.count}回
        </span>
      </div>
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

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg)',
      overflowY: 'auto',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '0.15em',
          color: 'var(--gold)',
          textShadow: '0 0 20px rgba(255,215,0,0.4)',
          fontStyle: 'italic',
        }}>
          ゼニ帳
        </span>
      </div>

      {/* Total profit hero */}
      <div style={{
        padding: '24px 20px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.2em',
          color: 'var(--text-sub)',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>
          生涯収支
        </div>
        <div style={{
          fontSize: total === 0 ? 42 : Math.abs(total) >= 10000000 ? 36 : Math.abs(total) >= 1000000 ? 42 : 52,
          fontWeight: 900,
          lineHeight: 1.1,
          color: total > 0 ? 'var(--gold)' : total < 0 ? 'var(--loss)' : 'var(--text-sub)',
          textShadow: total > 0
            ? '0 0 30px rgba(255,215,0,0.5)'
            : total < 0
            ? '0 0 30px rgba(231,76,60,0.4)'
            : 'none',
          letterSpacing: '-0.02em',
        }}>
          {formatYen(total)}
        </div>
      </div>

      {/* Today / Month */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        padding: '0 16px',
        marginBottom: 20,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: '0.1em' }}>
            今日の収支
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: today > 0 ? 'var(--profit)' : today < 0 ? 'var(--loss)' : 'var(--text-sub)',
          }}>
            {formatShort(today)}
          </div>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: '0.1em' }}>
            今月の収支
          </div>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: month > 0 ? 'var(--profit)' : month < 0 ? 'var(--loss)' : 'var(--text-sub)',
          }}>
            {formatShort(month)}
          </div>
        </div>
      </div>

      {/* Ranking section */}
      <div style={{
        padding: '0 16px',
        flex: 1,
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.25em',
          color: 'var(--gold)',
          marginBottom: 12,
          borderLeft: '3px solid var(--gold)',
          paddingLeft: 8,
        }}>
          ランキング
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          marginBottom: 16,
          paddingBottom: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
                background: activeTab === tab ? 'var(--gold)' : 'var(--bg-card)',
                color: activeTab === tab ? '#0a0a08' : 'var(--text-sub)',
                border: activeTab === tab ? 'none' : '1px solid var(--border)',
              }}
            >
              {RANKING_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Ranking list */}
        {ranking.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-sub)',
            fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>記録なし</div>
            <div>「記録する」から最初の戦績を入力してください</div>
          </div>
        ) : (
          <div>
            {ranking.map((item, i) => (
              <RankingBar key={item.label} item={item} max={maxAbs} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      {/* Floating record button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '12px 20px 20px',
        background: 'linear-gradient(transparent, var(--bg) 40%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #FFD700, #FFC200)',
            color: '#0a0a08',
            boxShadow: '0 4px 20px rgba(255,215,0,0.35)',
            pointerEvents: 'all',
            transition: 'transform 0.1s, box-shadow 0.1s',
            border: 'none',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          記録する
        </button>
      </div>
    </div>
  );
}
