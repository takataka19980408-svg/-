import { getCustomerDealerCrossTabByWeekday, formatYen } from '../storage';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  onBack: () => void;
}

export function CustomerDealerCrossTab({ onBack }: Props) {
  const swipeStyle = useSwipeBack(onBack);
  const tables = getCustomerDealerCrossTabByWeekday();

  return (
    <div style={swipeStyle}>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← 集計に戻る
      </button>

      <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 4 }}>
        客×ディーラー（曜日別）
      </div>
      <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, marginBottom: 16 }}>
        各マスは店収支（客が複数・ディーラーが複数の対応は按分済み）。閲覧専用です。
      </div>

      {tables.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '30px 0' }}>
          データがありません
        </div>
      ) : (
        tables.map(table => {
          const cellMap = new Map(table.cells.map(c => [`${c.customer}\u0000${c.dealer}`, c]));
          return (
            <div key={table.weekday} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: BRUSH, marginBottom: 8, letterSpacing: '0.05em' }}>
                {table.weekday}
              </div>
              <div style={{ overflowX: 'auto', border: `1px solid ${BDR}`, borderRadius: 10 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: BRUSH, minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{
                        position: 'sticky', left: 0, background: CARD, color: SUB, fontWeight: 700,
                        padding: '8px 10px', borderBottom: `1px solid ${BDR}`, borderRight: `1px solid ${BDR}`,
                        textAlign: 'left', whiteSpace: 'nowrap',
                      }}>
                        客＼ディーラー
                      </th>
                      {table.dealers.map(d => (
                        <th key={d} style={{
                          color: TEXT, fontWeight: 700, padding: '8px 10px', borderBottom: `1px solid ${BDR}`,
                          whiteSpace: 'nowrap', textAlign: 'right',
                        }}>
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.customers.map(c => (
                      <tr key={c}>
                        <td style={{
                          position: 'sticky', left: 0, background: CARD, color: TEXT, fontWeight: 700,
                          padding: '8px 10px', borderRight: `1px solid ${BDR}`, borderBottom: `1px solid ${BDR}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {c}
                        </td>
                        {table.dealers.map(d => {
                          const cell = cellMap.get(`${c}\u0000${d}`);
                          return (
                            <td key={d} style={{
                              padding: '8px 10px', borderBottom: `1px solid ${BDR}`, textAlign: 'right', whiteSpace: 'nowrap',
                              color: !cell ? SUB : cell.profit > 0 ? GOLDB : cell.profit < 0 ? REDB : SUB,
                            }}>
                              {cell ? `${formatYen(cell.profit)}円` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
