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
const GOLD      = '#D4AF37';
const RED       = '#A94438';
const BG        = '#0D0D0D';
const CARD_BG   = '#111111';
const BORDER    = '#222222';
const TEXT_MAIN = '#E8E0CC';
const TEXT_SUB  = '#555555';

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

  const totalColor = total > 0 ? GOLD : total < 0 ? RED : TEXT_SUB;
  const monthColor = month > 0 ? GOLD : month < 0 ? RED : TEXT_SUB;

  return (
    <div style={{ height: '100dvh', overflowY: 'auto', paddingBottom: NAV_H + 24, background: BG }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '20px 20px 16px', textAlign: 'center' }}>
        <div style={{
          fontSize: 34, fontWeight: 900, letterSpacing: '0.1em', lineHeight: 1,
          color: GOLD, fontFamily: 'sans-serif',
        }}>
          ゼニ帳
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.35em', color: TEXT_SUB, marginTop: 5, fontFamily: 'sans-serif' }}>
          戦績分析
        </div>
      </div>

      {/* 生涯収支 */}
      <div style={{ padding: '28px 20px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.35em', color: TEXT_SUB, marginBottom: 10, fontFamily: 'sans-serif' }}>
          生 涯 収 支
        </div>
        <div style={{
          fontSize: total === 0 ? 44 : Math.abs(total) >= 10000000 ? 36 : 52,
          fontWeight: 900, lineHeight: 1.05,
          color: totalColor,
          letterSpacing: '-0.01em', fontFamily: 'sans-serif',
        }}>
          {formatAmountFull(total)}
        </div>
      </div>

      {/* 今月収支 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: '16px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: TEXT_SUB, letterSpacing: '0.15em', marginBottom: 8, fontFamily: 'sans-serif' }}>
              今月の収支（{now.getMonth() + 1}月）
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: monthColor, fontFamily: 'sans-serif' }}>
              {formatAmountFull(month)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 8, fontFamily: 'sans-serif' }}>
              勝ち {summary.winDays}日 / 負け {summary.lossDays}日
            </div>
            {summary.recoveryRate !== null && (
              <div style={{
                fontSize: 16, fontWeight: 700, fontFamily: 'sans-serif',
                color: summary.recoveryRate >= 100 ? GOLD : RED,
              }}>
                回収率 {summary.recoveryRate}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* トップ戦場 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 10, fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>
          今月のトップ戦場
        </div>
        {battlefield ? (
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: 10, padding: '16px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: TEXT_MAIN, fontFamily: 'sans-serif' }}>
              {battlefield.label}
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'sans-serif', color: battlefield.profit >= 0 ? GOLD : RED }}>
              {formatAmount(battlefield.profit)}
            </span>
          </div>
        ) : (
          <div style={{
            background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '16px 18px', textAlign: 'center', fontSize: 13, color: TEXT_SUB, fontFamily: 'sans-serif',
          }}>
            今月のデータがありません
          </div>
        )}
      </div>

      {/* 記録するボタン */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%', padding: '17px',
            borderRadius: 8, fontSize: 16, fontWeight: 900, letterSpacing: '0.2em',
            background: 'transparent', color: GOLD,
            border: `2px solid ${GOLD}`,
            fontFamily: 'sans-serif',
          }}
          onTouchStart={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = BG; }}
          onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
        >
          記録する
        </button>
      </div>
    </div>
  );
}
