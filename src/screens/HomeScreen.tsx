import { useEffect, useState, useCallback } from 'react';
import {
  getTotalProfit, getMonthProfit, getMonthSummary,
  getTopBattlefieldThisMonth, formatAmountFull, formatAmount,
} from '../storage';

interface Props {
  onRecord: () => void;
  refreshKey: number;
}

const NAV_H = 60;

export function HomeScreen({ onRecord, refreshKey }: Props) {
  const now = new Date();
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState(0);
  const [summary, setSummary] = useState({ winDays: 0, lossDays: 0, evenDays: 0, recoveryRate: null as number | null });
  const [battlefield, setBattlefield] = useState<{ label: string; profit: number } | null>(null);

  const refresh = useCallback(() => {
    setTotal(getTotalProfit());
    setMonth(getMonthProfit());
    setSummary(getMonthSummary(now.getFullYear(), now.getMonth() + 1));
    setBattlefield(getTopBattlefieldThisMonth());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const totalColor = total > 0 ? 'var(--gold)' : total < 0 ? 'var(--loss)' : 'rgba(245,238,216,0.4)';
  const monthColor = month > 0 ? 'var(--profit)' : month < 0 ? 'var(--loss)' : 'rgba(245,238,216,0.4)';

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', paddingBottom: NAV_H + 24 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(180deg,#0a0020 0%,#080810 100%)',
        borderBottom: '1px solid rgba(255,215,0,0.12)',
        flexShrink: 0,
      }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 10px', textAlign: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: 18, color: 'var(--red)', fontSize: 14, opacity: 0.7 }}>卍</span>
          <span style={{ position: 'absolute', right: 16, top: 18, color: 'var(--red)', fontSize: 14, opacity: 0.7 }}>卍</span>
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: '0.12em', lineHeight: 1,
            color: 'var(--gold)',
            textShadow: '0 0 30px rgba(255,215,0,0.7),0 0 60px rgba(255,215,0,0.25),2px 2px 0 rgba(100,60,0,0.8)',
            fontFamily: '"Hiragino Mincho ProN","Yu Mincho",serif',
          }}>ゼニ帳</div>
          <div style={{ fontSize: 10, letterSpacing: '0.35em', color: 'var(--gold)', opacity: 0.55, marginTop: 3, fontFamily: 'sans-serif' }}>
            ━ 戦績分析 ━
          </div>
        </div>
      </div>

      {/* ── 生涯収支 ── */}
      <div style={{ padding: '20px 20px 12px', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.4em', color: 'var(--gold)', opacity: 0.75, marginBottom: 6, fontFamily: 'sans-serif' }}>
          〔 生 涯 収 支 〕
        </div>
        <div style={{
          fontSize: total === 0 ? 42 : Math.abs(total) >= 10000000 ? 34 : 50,
          fontWeight: 900, lineHeight: 1.05,
          color: totalColor,
          textShadow: total !== 0 ? `0 0 40px ${totalColor}88` : 'none',
          letterSpacing: '-0.01em', fontFamily: 'sans-serif',
        }}>
          {formatAmountFull(total)}
        </div>
      </div>

      {/* ── 今月収支 ── */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-sub)', letterSpacing: '0.15em', marginBottom: 4, fontFamily: 'sans-serif' }}>
              今月の収支（{now.getMonth() + 1}月）
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: monthColor,
              textShadow: month !== 0 ? `0 0 16px ${monthColor}66` : 'none',
              fontFamily: 'sans-serif',
            }}>
              {formatAmountFull(month)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-sub)', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'sans-serif' }}>
              勝ち {summary.winDays}日 / 負け {summary.lossDays}日
            </div>
            {summary.recoveryRate !== null && (
              <div style={{
                fontSize: 16, fontWeight: 800, fontFamily: 'sans-serif',
                color: summary.recoveryRate >= 100 ? 'var(--profit)' : 'var(--loss)',
              }}>
                回収率 {summary.recoveryRate}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── トップ戦場 ── */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: 8, borderLeft: '3px solid var(--red)', paddingLeft: 8 }}>
          今月のトップ戦場
        </div>
        {battlefield ? (
          <div style={{
            background: 'radial-gradient(ellipse at 50% 0%,rgba(255,215,0,0.06) 0%,var(--bg-card) 70%)',
            border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.05em' }}>
              {battlefield.label}
            </span>
            <span style={{
              fontSize: 18, fontWeight: 900, fontFamily: 'sans-serif',
              color: battlefield.profit >= 0 ? 'var(--gold)' : 'var(--loss)',
              textShadow: `0 0 12px ${battlefield.profit >= 0 ? 'rgba(255,215,0,0.5)' : 'rgba(255,51,51,0.4)'}`,
            }}>
              {formatAmount(battlefield.profit)}
            </span>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '14px 18px', textAlign: 'center', fontSize: 13, color: 'var(--text-sub)', fontFamily: 'sans-serif',
          }}>
            今月のデータがありません
          </div>
        )}
      </div>

      {/* ── 記録するボタン ── */}
      <div style={{ padding: '8px 16px 0' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%', padding: '17px', borderRadius: 6,
            fontSize: 18, fontWeight: 900, letterSpacing: '0.2em',
            background: 'linear-gradient(135deg,#B22200 0%,#FF3300 40%,#FFD700 100%)',
            color: '#FFF5A0',
            boxShadow: '0 4px 24px rgba(200,50,0,0.5),0 0 40px rgba(255,100,0,0.15)',
            border: '1px solid rgba(255,200,0,0.3)',
            fontFamily: '"Hiragino Mincho ProN",serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          ◆ 記録する ◆
        </button>
      </div>
    </div>
  );
}
