import { useEffect, useState } from 'react';
import type { GamblingRecord } from '../types';
import { CATEGORY_LABELS, WEEKDAY_LABELS } from '../types';
import { getRecords, deleteRecord, formatAmount } from '../storage';

interface Props { refreshKey: number; }

const NAV_H = 60;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const wd = WEEKDAY_LABELS[d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${wd}）`;
}

interface Group {
  date: string;
  records: GamblingRecord[];
  dayProfit: number;
}

export function HistoryScreen({ refreshKey }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = () => {
    const sorted = [...getRecords()].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
    const map = new Map<string, GamblingRecord[]>();
    for (const r of sorted) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    setGroups(Array.from(map.entries()).map(([date, recs]) => ({
      date,
      records: recs,
      dayProfit: recs.reduce((s, r) => s + r.profit, 0),
    })));
  };

  useEffect(load, [refreshKey]);

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a0020,#080810)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,var(--red),var(--gold),var(--red))' }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.12)' }}>
          <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.25em', color: 'var(--gold)', textShadow: '0 0 16px rgba(255,215,0,0.4)', fontFamily: '"Hiragino Mincho ProN",serif' }}>
            戦績履歴
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: NAV_H + 16 }}>
        {groups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-sub)', fontFamily: 'sans-serif', fontSize: 14 }}>
            <div style={{ fontSize: 32, color: 'rgba(255,215,0,0.2)', marginBottom: 12 }}>無記録</div>
            記録がありません
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date} style={{ marginBottom: 4 }}>
              {/* Date header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px 6px',
                background: 'linear-gradient(90deg,rgba(255,215,0,0.06),transparent)',
                borderBottom: '1px solid rgba(255,215,0,0.1)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>
                  {formatDate(group.date)}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 900, fontFamily: 'sans-serif',
                  color: group.dayProfit > 0 ? 'var(--gold)' : group.dayProfit < 0 ? 'var(--loss)' : 'var(--text-sub)',
                }}>
                  日計 {formatAmount(group.dayProfit)}
                </span>
              </div>

              {/* Records */}
              {group.records.map(record => (
                <div
                  key={record.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid rgba(255,215,0,0.05)',
                    background: deleteTarget === record.id ? 'rgba(255,51,51,0.05)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                        {record.storeName}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, fontFamily: 'sans-serif',
                        background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: 'var(--gold)',
                      }}>
                        {CATEGORY_LABELS[record.category] ?? record.category}
                      </span>
                      {record.time && (
                        <span style={{ fontSize: 10, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>{record.time}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>
                        IN ¥{record.inAmount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>→</span>
                      <span style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'sans-serif' }}>
                        OUT ¥{record.outAmount.toLocaleString()}
                      </span>
                    </div>
                    {record.memo && (
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 3, fontFamily: 'sans-serif', fontStyle: 'italic' }}>
                        {record.memo}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 16, fontWeight: 900, fontFamily: 'sans-serif',
                      color: record.profit > 0 ? 'var(--gold)' : record.profit < 0 ? 'var(--loss)' : 'var(--text-sub)',
                    }}>
                      {formatAmount(record.profit)}
                    </div>
                    {deleteTarget === record.id ? (
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button
                          onClick={() => handleDelete(record.id)}
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--loss)', color: '#fff', border: 'none', fontFamily: 'sans-serif', fontWeight: 700 }}
                        >
                          削除
                        </button>
                        <button
                          onClick={() => setDeleteTarget(null)}
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-sub)', border: '1px solid var(--border)', fontFamily: 'sans-serif' }}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(record.id)}
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'sans-serif', padding: '2px 4px', marginTop: 4 }}
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
