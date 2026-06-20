import { useEffect, useState } from 'react';
import type { GamblingRecord } from '../types';
import { CATEGORY_LABELS, WEEKDAY_LABELS } from '../types';
import { getRecords, deleteRecord, updateRecordMemo, formatAmount } from '../storage';

interface Props { refreshKey: number; }

const NAV_H = 60;
const GOLD  = '#C9A227';
const GOLDB = '#F5D060';
const RED   = '#9B1C10';
const REDB  = '#FF3300';
const CARD  = '#0F0E0A';
const BDR   = '#222018';
const TEXT  = '#EDE3C0';
const SUB   = '#524938';
const BRUSH = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

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

type ActionState =
  | { type: 'none' }
  | { type: 'menu';   id: string }
  | { type: 'memo';   id: string; draft: string }
  | { type: 'delete'; id: string };

export function HistoryScreen({ refreshKey }: Props) {
  const [groups, setGroups]   = useState<Group[]>([]);
  const [action, setAction]   = useState<ActionState>({ type: 'none' });

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

  const dismiss = () => setAction({ type: 'none' });

  const handleDelete = (id: string) => {
    deleteRecord(id);
    dismiss();
    load();
  };

  const handleMemoSave = (id: string, draft: string) => {
    updateRecordMemo(id, draft);
    dismiss();
    load();
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0A0905' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(180deg,#0E0D08,#0A0905)', borderBottom: `1px solid ${BDR}` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${RED},${GOLD} 30%,${GOLDB} 50%,${GOLD} 70%,${RED})` }} />
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '0.25em',
            color: GOLD, fontFamily: BRUSH,
            textShadow: `0 0 16px ${GOLD}66`,
          }}>
            戦績履歴
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: NAV_H + 16 }}>
        {groups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 14 }}>
            <div style={{ fontSize: 32, color: `${GOLD}33`, marginBottom: 12 }}>無記録</div>
            記録がありません
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date} style={{ marginBottom: 4 }}>
              {/* Date header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px 6px',
                background: `linear-gradient(90deg,${GOLD}0A,transparent)`,
                borderBottom: `1px solid ${GOLD}1A`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', fontFamily: BRUSH }}>
                  {formatDate(group.date)}
                </span>
                <span style={{
                  fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
                  color: group.dayProfit > 0 ? GOLDB : group.dayProfit < 0 ? REDB : SUB,
                }}>
                  日計 {formatAmount(group.dayProfit)}
                </span>
              </div>

              {/* Records */}
              {group.records.map(record => {
                const act = action.type !== 'none' && action.id === record.id ? action : null;

                return (
                  <div key={record.id} style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${GOLD}0D`,
                    background: act?.type === 'delete' ? `${RED}0A` : 'transparent',
                  }}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 14, fontWeight: 700, color: TEXT,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%',
                            fontFamily: BRUSH,
                          }}>
                            {record.storeName}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, fontFamily: BRUSH,
                            background: `${GOLD}14`, border: `1px solid ${GOLD}33`, color: GOLD,
                          }}>
                            {CATEGORY_LABELS[record.category] ?? record.category}
                          </span>
                          {record.time && (
                            <span style={{ fontSize: 10, color: SUB, fontFamily: BRUSH }}>{record.time}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                            IN ¥{record.inAmount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, color: `${SUB}88` }}>→</span>
                          <span style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                            OUT ¥{record.outAmount.toLocaleString()}
                          </span>
                        </div>
                        {record.memo && (
                          <div style={{ fontSize: 11, color: `${TEXT}88`, marginTop: 3, fontFamily: BRUSH, fontStyle: 'italic' }}>
                            {record.memo}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 16, fontWeight: 800, fontFamily: BRUSH,
                          color: record.profit > 0 ? GOLDB : record.profit < 0 ? REDB : SUB,
                        }}>
                          {formatAmount(record.profit)}
                        </div>

                        {/* Action button */}
                        {!act ? (
                          <button
                            onClick={() => setAction({ type: 'menu', id: record.id })}
                            style={{
                              fontSize: 10, color: `${TEXT}33`, fontFamily: BRUSH,
                              padding: '2px 4px', marginTop: 4,
                              background: 'none', border: 'none', cursor: 'pointer',
                            }}
                          >
                            ⋯
                          </button>
                        ) : act.type === 'menu' ? (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <button
                              onClick={() => setAction({ type: 'memo', id: record.id, draft: record.memo ?? '' })}
                              style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: `${GOLD}18`, color: GOLD,
                                border: `1px solid ${GOLD}44`, fontFamily: BRUSH, cursor: 'pointer',
                              }}
                            >
                              メモ
                            </button>
                            <button
                              onClick={() => setAction({ type: 'delete', id: record.id })}
                              style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: `${RED}18`, color: REDB,
                                border: `1px solid ${RED}44`, fontFamily: BRUSH, cursor: 'pointer',
                              }}
                            >
                              削除
                            </button>
                            <button
                              onClick={dismiss}
                              style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: CARD, color: SUB,
                                border: `1px solid ${BDR}`, fontFamily: BRUSH, cursor: 'pointer',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : act.type === 'delete' ? (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <button
                              onClick={() => handleDelete(record.id)}
                              style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: REDB, color: '#fff',
                                border: 'none', fontFamily: BRUSH, cursor: 'pointer',
                              }}
                            >
                              削除確定
                            </button>
                            <button
                              onClick={dismiss}
                              style={{
                                fontSize: 11, padding: '3px 8px', borderRadius: 4,
                                background: CARD, color: SUB,
                                border: `1px solid ${BDR}`, fontFamily: BRUSH, cursor: 'pointer',
                              }}
                            >
                              取消
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Memo edit panel */}
                    {act?.type === 'memo' && (
                      <div style={{ marginTop: 10 }}>
                        <textarea
                          value={act.draft}
                          onChange={e => setAction({ type: 'memo', id: record.id, draft: e.target.value })}
                          placeholder="台の種類、状況など…"
                          rows={2}
                          autoFocus
                          style={{
                            width: '100%', padding: '10px 12px',
                            background: CARD, border: `1px solid ${GOLD}55`,
                            borderRadius: 6, fontSize: 13, color: TEXT,
                            resize: 'none', fontFamily: BRUSH, outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            onClick={() => handleMemoSave(record.id, act.draft)}
                            style={{
                              flex: 1, padding: '8px', borderRadius: 5,
                              background: `linear-gradient(135deg,${RED},${REDB})`,
                              color: GOLDB, fontSize: 13, fontWeight: 700,
                              fontFamily: BRUSH, border: `1px solid ${RED}66`, cursor: 'pointer',
                            }}
                          >
                            保存
                          </button>
                          <button
                            onClick={dismiss}
                            style={{
                              padding: '8px 16px', borderRadius: 5,
                              background: CARD, color: SUB, fontSize: 13,
                              fontFamily: BRUSH, border: `1px solid ${BDR}`, cursor: 'pointer',
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
