import { useMemo, useState } from 'react';
import { CATEGORY_INFO } from '../types';
import {
  getExpenses, getExpensesForMonth, getMonthlyTrend, getDailyDataForMonth, getCategoryBreakdown,
  getStoreRanking, getCompanyRanking, getCategoryRanking, getSettings,
} from '../storage';
import { C, NAV_H } from '../theme';
import { Card, SectionTitle, EmptyState } from '../components/ui';
import { DonutChart } from '../components/DonutChart';
import { VerticalBarChart } from '../components/VerticalBarChart';
import { BarList, type BarListItem } from '../components/BarList';

interface Props { refreshKey: number; }

type Tab = 'graph' | 'ranking';
type RankDimension = 'store' | 'company' | 'category';
type RankPeriod = 'month' | 'all';

export function AnalysisScreen({ refreshKey }: Props) {
  const [tab, setTab] = useState<Tab>('graph');
  const now = new Date();

  return (
    <div style={{ background: C.page, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 16px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, textAlign: 'center', marginBottom: 12 }}>分析</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <TabButton active={tab === 'graph'} onClick={() => setTab('graph')}>グラフ</TabButton>
          <TabButton active={tab === 'ranking'} onClick={() => setTab('ranking')}>ランキング</TabButton>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 20 }}>
        {tab === 'graph'
          ? <GraphTab refreshKey={refreshKey} year={now.getFullYear()} month={now.getMonth() + 1} />
          : <RankingTab refreshKey={refreshKey} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700,
        color: active ? C.brand : C.textMuted,
        borderBottom: active ? `2px solid ${C.brand}` : `2px solid transparent`,
      }}
    >
      {children}
    </button>
  );
}

function GraphTab({ refreshKey, year, month }: { refreshKey: number; year: number; month: number }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trend = useMemo(() => getMonthlyTrend(6), [refreshKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daily = useMemo(() => getDailyDataForMonth(year, month), [refreshKey, year, month]);

  const settings = getSettings();
  const monthExpenses = getExpensesForMonth(year, month);
  const breakdown = getCategoryBreakdown(monthExpenses).map(b => ({
    label: CATEGORY_INFO[b.category].label,
    value: b.amount,
    colorVar: CATEGORY_INFO[b.category].colorVar,
  }));

  const trendItems = trend.map((p, idx) => ({ label: p.label, value: p.amount, highlight: idx === trend.length - 1 }));
  const dailyItems = daily.map(d => ({ label: String(d.day), value: d.amount }));

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <SectionTitle>月別の支出推移（過去6ヶ月）</SectionTitle>
        <Card style={{ padding: '18px 14px 12px' }}>
          <VerticalBarChart items={trendItems} thresholdValue={settings.monthlyBudget} thresholdLabel="予算" />
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionTitle>今月の日別支出</SectionTitle>
        <Card style={{ padding: '18px 14px 12px' }}>
          <VerticalBarChart items={dailyItems} showAllLabels={false} height={110} />
        </Card>
      </div>

      <div>
        <SectionTitle>今月のカテゴリ内訳</SectionTitle>
        {breakdown.length > 0 ? (
          <Card style={{ padding: 18 }}>
            <DonutChart items={breakdown} />
          </Card>
        ) : (
          <EmptyState>今月の記録がまだありません</EmptyState>
        )}
      </div>
    </>
  );
}

function RankingTab({ refreshKey }: { refreshKey: number }) {
  const [dimension, setDimension] = useState<RankDimension>('store');
  const [period, setPeriod] = useState<RankPeriod>('month');
  const now = new Date();

  const items: BarListItem[] = useMemo(() => {
    const now2 = new Date();
    const expenses = period === 'month' ? getExpensesForMonth(now2.getFullYear(), now2.getMonth() + 1) : getExpenses();
    if (dimension === 'store') return getStoreRanking(expenses).map(r => ({ label: r.label, value: r.amount, count: r.count }));
    if (dimension === 'company') return getCompanyRanking(expenses).map(r => ({ label: r.label, value: r.amount, count: r.count }));
    return getCategoryRanking(expenses).map(r => ({ label: r.label, value: r.amount, count: r.count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, period, refreshKey]);

  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['month', 'all'] as RankPeriod[]).map(p => (
          <ChipButton key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p === 'month' ? `${now.getMonth() + 1}月` : '全期間'}
          </ChipButton>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {([['store', '店舗別'], ['company', '企業別'], ['category', 'カテゴリ別']] as [RankDimension, string][]).map(([d, label]) => (
          <ChipButton key={d} active={dimension === d} onClick={() => setDimension(d)}>{label}</ChipButton>
        ))}
      </div>

      {items.length > 0 ? (
        <Card style={{ padding: 16 }}>
          <BarList items={items} />
        </Card>
      ) : (
        <EmptyState>データがありません</EmptyState>
      )}
    </>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
        background: active ? C.brand : C.card2,
        color: active ? '#fff' : C.textSecondary,
      }}
    >
      {children}
    </button>
  );
}
