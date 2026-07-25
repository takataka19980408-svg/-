import { useMemo } from 'react';
import type { Expense } from '../types';
import { CATEGORY_INFO } from '../types';
import {
  getExpenses, getExpensesForMonth, getCategoryBreakdown, getMonthSpending,
  getStoreRanking, getSettings, formatYen,
} from '../storage';
import { C, FONT, NAV_H } from '../theme';
import { Card, SectionTitle, EmptyState } from '../components/ui';
import { DonutChart } from '../components/DonutChart';

interface Props { refreshKey: number; }

export function HomeScreen({ refreshKey }: Props) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;

  const { monthExpenses, recent, topStore } = useMemo(() => {
    const me = getExpensesForMonth(y, m);
    const recentList: Expense[] = getExpenses().slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
    const ranking = getStoreRanking(me);
    const top = ranking[0] ? { label: ranking[0].label, amount: ranking[0].amount } : null;
    return { monthExpenses: me, recent: recentList, topStore: top };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, y, m]);

  const settings = getSettings();
  const monthTotal = getMonthSpending(y, m);
  const budget = settings.monthlyBudget;
  const budgetPct = budget ? Math.min((monthTotal / budget) * 100, 100) : null;
  const over = budget !== null && budget !== undefined && monthTotal > budget;

  const breakdown = getCategoryBreakdown(monthExpenses).map(b => ({
    label: CATEGORY_INFO[b.category].label,
    value: b.amount,
    colorVar: CATEGORY_INFO[b.category].colorVar,
  }));

  return (
    <div style={{ background: C.page, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        flexShrink: 0, background: `linear-gradient(180deg,${C.surface} 0%,${C.page} 100%)`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${C.brand},${C.brandBright} 50%,${C.brand},transparent)` }} />
        <div style={{ padding: '16px 0 14px', textAlign: 'center' }}>
          <div style={{
            fontSize: 24, fontWeight: 800, letterSpacing: '0.18em', color: C.brand,
            fontFamily: FONT, textShadow: `0 0 18px rgba(201,162,39,0.35)`,
          }}>
            家 計 簿
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', paddingBottom: NAV_H + 20 }}>

        {/* 今月の支出 */}
        <Card style={{ padding: '22px 18px', marginBottom: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontFamily: FONT, letterSpacing: '0.15em' }}>
            {m}月の支出
          </div>
          <div style={{
            fontSize: 38, fontWeight: 800, color: C.brandBright, marginBottom: budget ? 14 : 0,
            fontFamily: FONT, textShadow: `0 0 24px rgba(201,162,39,0.3)`,
          }}>
            {formatYen(monthTotal)}
          </div>
          {budget != null && (
            <>
              <div style={{ height: 8, background: C.card2, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  height: '100%', width: `${budgetPct}%`, borderRadius: 4,
                  background: over ? `linear-gradient(90deg,${C.danger},${C.dangerBright})` : `linear-gradient(90deg,${C.brand},${C.brandBright})`,
                }} />
              </div>
              <div style={{ fontSize: 11, color: over ? C.dangerBright : C.textMuted, fontFamily: FONT }}>
                予算 {formatYen(budget)} 中 {over ? '予算オーバー' : `残り ${formatYen(Math.max(budget - monthTotal, 0))}`}
              </div>
            </>
          )}
        </Card>

        {/* カテゴリ内訳 */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>今月のカテゴリ内訳</SectionTitle>
          {breakdown.length > 0 ? (
            <Card style={{ padding: '18px' }}>
              <DonutChart items={breakdown} />
            </Card>
          ) : (
            <EmptyState>今月の記録がまだありません</EmptyState>
          )}
        </div>

        {/* 今月最も使ったお店 */}
        {topStore && (
          <div style={{ marginBottom: 20 }}>
            <SectionTitle>今月よく使ったお店</SectionTitle>
            <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>{topStore.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.brandBright, fontFamily: FONT }}>{formatYen(topStore.amount)}</span>
            </Card>
          </div>
        )}

        {/* 最近の記録 */}
        <div>
          <SectionTitle>最近の記録</SectionTitle>
          {recent.length > 0 ? (
            <Card style={{ overflow: 'hidden' }}>
              {recent.map((e, idx) => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderBottom: idx < recent.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2.5, flexShrink: 0,
                    background: CATEGORY_INFO[e.category].colorVar,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.storeName}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{e.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, flexShrink: 0, fontFamily: FONT }}>
                    {formatYen(e.amount)}
                  </span>
                </div>
              ))}
            </Card>
          ) : (
            <EmptyState>まだ記録がありません。「記録」からレシートを読み取ってみましょう。</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
