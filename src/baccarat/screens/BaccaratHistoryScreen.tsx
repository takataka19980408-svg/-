import { useState } from 'react';
import { getRecords, deleteRecord, formatYen } from '../storage';
import { GOLD, GOLDB, REDB, CARD, BDR, SUB, BRUSH, FELTD, NAV_H } from '../theme';

interface Props {
  refreshKey: number;
  onDataChange: () => void;
}

export function BaccaratHistoryScreen({ refreshKey, onDataChange }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const records = getRecords().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: NAV_H + 16 }}>
        {records.length === 0 && (
          <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '40px 0' }}>
            まだ記録がありません
          </div>
        )}
        {records.map(r => {
          const storeProfit = r.inAmount - r.outAmount;
          return (
            <div key={r.id} style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: SUB, fontFamily: BRUSH }}>{r.date}{r.table ? ` ${r.table}` : ''}</span>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                  color: storeProfit > 0 ? GOLDB : storeProfit < 0 ? REDB : SUB,
                }}>
                  {formatYen(storeProfit)}円
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.memo ? 6 : 0 }}>
                <Tag>{r.dealer}</Tag>
                <Tag>{r.shuffle}</Tag>
                {r.customerId && <Tag>{r.customerId}</Tag>}
              </div>
              {r.memo && (
                <div style={{ fontSize: 12, color: SUB, fontFamily: BRUSH, marginBottom: 6 }}>{r.memo}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                  IN {r.inAmount.toLocaleString()} / OUT {r.outAmount.toLocaleString()}
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
