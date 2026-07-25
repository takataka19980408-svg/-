import { useMemo, useState } from 'react';
import type { Expense, ExpenseCategory } from '../types';
import { CATEGORY_INFO, CATEGORY_ORDER } from '../types';
import { getExpensesForMonth, deleteExpense, updateExpense, formatYen, getMonthSpending } from '../storage';
import { C, FONT, NAV_H } from '../theme';
import { Card, EmptyState } from '../components/ui';

interface Props { refreshKey: number; }

function monthLabel(y: number, m: number) { return `${y}年${m}月`; }

export function HistoryScreen({ refreshKey }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [localVersion, setLocalVersion] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Expense> | null>(null);

  const expenses = useMemo(
    () => getExpensesForMonth(year, month),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, refreshKey, localVersion],
  );

  const shift = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setYear(y); setMonth(m);
  };

  const filtered = useMemo(
    () => expenses.filter(e => categoryFilter === 'all' || e.category === categoryFilter)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [expenses, categoryFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const monthTotal = getMonthSpending(year, month);

  const startEdit = (e: Expense) => { setEditing({ ...e }); setExpandedId(e.id); };

  const saveEdit = () => {
    if (!editing?.id) return;
    updateExpense(editing.id, {
      amount: editing.amount,
      category: editing.category,
      memo: editing.memo,
    });
    setLocalVersion(v => v + 1);
    setEditing(null);
    setExpandedId(null);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setLocalVersion(v => v + 1);
    setExpandedId(null);
    setEditing(null);
  };

  return (
    <div style={{ background: C.page, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${C.brand},${C.brandBright} 50%,${C.brand},transparent)` }} />
        <div style={{ padding: '13px 16px 12px' }}>
          <div style={{
            fontSize: 16, fontWeight: 800, color: C.brand, textAlign: 'center', marginBottom: 10,
            fontFamily: FONT, letterSpacing: '0.15em',
          }}>
            履 歴
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => shift(-1)} style={{ fontSize: 18, padding: '4px 10px', color: C.brand }}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT }}>{monthLabel(year, month)}</span>
            <button onClick={() => shift(1)} style={{ fontSize: 18, padding: '4px 10px', color: C.brand }}>›</button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.brandBright, marginTop: 2, fontFamily: FONT }}>
            合計 {formatYen(monthTotal)}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', background: C.page }}>
        <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>すべて</FilterChip>
        {CATEGORY_ORDER.map(cat => (
          <FilterChip key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} colorVar={CATEGORY_INFO[cat].colorVar}>
            {CATEGORY_INFO[cat].label}
          </FilterChip>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px', paddingBottom: NAV_H + 20 }}>
        {groups.length === 0 && <EmptyState>この月の記録はありません</EmptyState>}
        {groups.map(([date, list]) => (
          <div key={date} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, margin: '10px 2px 6px', fontFamily: FONT }}>
              {date.slice(5).replace('-', '/')}
            </div>
            <Card style={{ overflow: 'hidden' }}>
              {list.map((e, idx) => {
                const expanded = expandedId === e.id;
                return (
                  <div key={e.id} style={{ borderBottom: idx < list.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <button
                      onClick={() => { setExpandedId(expanded ? null : e.id); setEditing(null); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', textAlign: 'left' }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 2.5, flexShrink: 0, background: CATEGORY_INFO[e.category].colorVar }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.storeName}
                        </div>
                        <div style={{ fontSize: 10, color: C.textMuted }}>{CATEGORY_INFO[e.category].label}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.brandBright, fontFamily: FONT }}>{formatYen(e.amount)}</span>
                    </button>

                    {expanded && (
                      <div style={{ padding: '0 14px 14px' }}>
                        {e.receiptImage && (
                          <img src={e.receiptImage} alt="レシート" style={{
                            width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8,
                            border: `1px solid ${C.border}`, marginBottom: 10, background: C.card2,
                          }} />
                        )}

                        {editing?.id === e.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input
                              type="number" value={editing.amount ?? 0}
                              onChange={ev => setEditing({ ...editing, amount: parseInt(ev.target.value, 10) || 0 })}
                              style={editInputStyle}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {CATEGORY_ORDER.map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => setEditing({ ...editing, category: cat })}
                                  style={{
                                    padding: '5px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: FONT,
                                    background: editing.category === cat ? CATEGORY_INFO[cat].colorVar : C.card2,
                                    color: editing.category === cat ? '#1a1408' : C.textSecondary,
                                  }}
                                >
                                  {CATEGORY_INFO[cat].label}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text" value={editing.memo ?? ''} placeholder="メモ"
                              onChange={ev => setEditing({ ...editing, memo: ev.target.value })}
                              style={editInputStyle}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={saveEdit} style={{ flex: 1, padding: '9px', borderRadius: 8, background: `linear-gradient(135deg,${C.brand},${C.brandBright})`, color: '#1a1408', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                保存
                              </button>
                              <button onClick={() => setEditing(null)} style={{ padding: '9px 14px', borderRadius: 8, background: C.card2, color: C.textSecondary, fontSize: 12, fontFamily: FONT }}>
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {e.memo && <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10, fontFamily: FONT }}>{e.memo}</div>}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => startEdit(e)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: C.card2, color: C.text, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                編集
                              </button>
                              <button onClick={() => handleDelete(e.id)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: C.dangerDim, color: C.dangerBright, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
                                削除
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active, onClick, children, colorVar,
}: { active: boolean; onClick: () => void; children: React.ReactNode; colorVar?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 700, fontFamily: FONT,
        background: active ? (colorVar ?? `linear-gradient(135deg,${C.brand},${C.brandBright})`) : C.card2,
        color: active ? '#1a1408' : C.textSecondary,
        border: `1px solid ${active ? 'transparent' : C.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

const editInputStyle: React.CSSProperties = {
  padding: '9px 12px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8,
  fontSize: 13, color: C.text,
};
