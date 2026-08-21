import { useState } from 'react';
import { getRecords, deleteRecord, formatYen, getDayKey } from '../storage';
import type { BaccaratRecord } from '../types';
import { GOLD, GOLDB, REDB, CARD, BDR, SUB, BRUSH, FELTD, NAV_H } from '../theme';

interface Props {
  refreshKey: number;
  onDataChange: () => void;
}

interface DayGroup {
  date: string;
  label: string;
  storeProfit: number;
  records: BaccaratRecord[];
}

function groupByDay(records: BaccaratRecord[]): DayGroup[] {
  const map = new Map<string, BaccaratRecord[]>();
  for (const r of records) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, recs]) => ({
      date,
      label: getDayKey(date),
      storeProfit: recs.reduce((sum, r) => sum + (r.endAmount - r.startAmount), 0),
      records: recs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }));
}

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

const DAY_PAGE_SIZE = 14;

export function BaccaratHistoryScreen({ refreshKey, onDataChange }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [visibleDayCount, setVisibleDayCount] = useState(DAY_PAGE_SIZE);
  const allGroups = groupByDay(getRecords());
  const groups = allGroups.slice(0, visibleDayCount);
  void refreshKey;

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setConfirmId(null);
    onDataChange();
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#07100C' }}>
      <div style={{ flexShrink: 0, background: `linear-gradient(180deg,${FELTD},#07100C)`, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ padding: '14px 20px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.2em', color: GOLD, fontFamily: BRUSH }}>履歴</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingBottom: NAV_H + 16 }}>
        {groups.length === 0 && (
          <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '40px 0' }}>
            まだ記録がありません
          </div>
        )}
        {groups.map((group, gi) => (
          <div key={group.date} style={{ marginTop: gi === 0 ? 0 : 20 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${BDR}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: BRUSH, letterSpacing: '0.05em' }}>
                {group.label}（{group.records.length}件）
              </span>
              <span style={{
                fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                color: group.storeProfit > 0 ? GOLDB : group.storeProfit < 0 ? REDB : SUB,
              }}>
                {formatYen(group.storeProfit)}円
              </span>
            </div>

            {group.records.map(r => {
              const storeProfit = r.endAmount - r.startAmount;
              return (
                <div key={r.id} style={{
                  background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>
                      {formatTime(r.createdAt)}{r.table ? ` ・ ${r.table}` : ''}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                      color: storeProfit > 0 ? GOLDB : storeProfit < 0 ? REDB : SUB,
                    }}>
                      {formatYen(storeProfit)}円
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.memo ? 6 : 0 }}>
                    {r.dealerIds.map(d => <Tag key={d}>{d}</Tag>)}
                    <Tag>{r.shuffle}</Tag>
                    {(r.customerIds ?? []).map(c => <Tag key={c}>{c}</Tag>)}
                  </div>
                  {r.memo && (
                    <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, marginBottom: 6 }}>{r.memo}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                      スタート {r.startAmount.toLocaleString()} / エンド {r.endAmount.toLocaleString()}
                    </span>
                    {confirmId === r.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleDelete(r.id)} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, background: REDB, color: '#fff',
                          border: 'none', fontFamily: BRUSH, cursor: 'pointer',
                        }}>削除する</button>
                        <button onClick={() => setConfirmId(null)} style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 4, background: 'transparent', color: SUB,
                          border: `1px solid ${BDR}`, fontFamily: BRUSH, cursor: 'pointer',
                        }}>取消</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(r.id)} style={{
                        fontSize: 11, color: SUB, background: 'none', border: 'none', fontFamily: BRUSH, cursor: 'pointer',
                      }}>削除</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {allGroups.length > visibleDayCount && (
          <button
            onClick={() => setVisibleDayCount(v => v + DAY_PAGE_SIZE)}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: CARD, border: `1px solid ${BDR}`, color: SUB, cursor: 'pointer', marginTop: 20,
            }}
          >
            もっと見る（残り{(allGroups.length - visibleDayCount).toLocaleString()}日）
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10,
      background: `${GOLD}14`, border: `1px solid ${GOLD}33`, color: GOLD, fontFamily: BRUSH,
    }}>
      {children}
    </span>
  );
}
