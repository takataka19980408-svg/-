import { Fragment } from 'react';
import { getCustomerRankTable } from '../storage';
import type { CustomerRankEntry } from '../storage';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, DIGIT_FONT } from '../theme';

interface Props {
  onBack: () => void;
}

function RankCell({ entry, groupEnd }: { entry: CustomerRankEntry | undefined; groupEnd: boolean }) {
  const borderRight = groupEnd ? `1px solid ${BDR}` : 'none';
  if (!entry) {
    return (
      <td style={{ padding: '7px 4px', borderBottom: `1px solid ${BDR}`, borderRight, textAlign: 'center', color: BDR }}>—</td>
    );
  }
  const color = entry.profit > 0 ? GOLDB : entry.profit < 0 ? REDB : SUB;
  return (
    <td style={{
      padding: '7px 4px', borderBottom: `1px solid ${BDR}`, borderRight, textAlign: 'center',
      fontFamily: DIGIT_FONT, fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums', color,
    }}>
      {entry.rank}
    </td>
  );
}

export function CustomerRankTable({ onBack }: Props) {
  const swipeStyle = useSwipeBack(onBack);
  const { codes, rows } = getCustomerRankTable();

  return (
    <div style={swipeStyle}>
      <button
        onClick={onBack}
        style={{
          fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
        }}
      >
        ← 客別集計に戻る
      </button>

      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '14px 16px', marginBottom: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, fontFamily: BRUSH, marginBottom: 8 }}>
          客別 勝敗ランキング早見表
        </div>
        <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH, lineHeight: 1.7, marginBottom: 10 }}>
          客ごとに、各符丁を「シャッフルとして見たときの店収支順位」「ディーラーとして見たときの店収支順位」で1〜5位に並べています。
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11 }}>
          <span style={{ color: GOLDB, fontFamily: DIGIT_FONT, fontWeight: 800 }}>1</span>
          <span style={{ color: SUB, fontFamily: BRUSH }}>店が勝ち（客が負け）に近い</span>
          <span style={{ color: REDB, fontFamily: DIGIT_FONT, fontWeight: 800 }}>5</span>
          <span style={{ color: SUB, fontFamily: BRUSH }}>店が負け（客が勝ち）に近い</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '30px 0' }}>データがありません</div>
      ) : (
        <div style={{ overflowX: 'auto', border: `1px solid ${BDR}`, borderRadius: 10 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={{
                  position: 'sticky', left: 0, top: 0, zIndex: 3, background: '#121D17', color: GOLD,
                  fontFamily: BRUSH, fontWeight: 800, padding: '7px 10px 4px', borderBottom: `1px solid ${BDR}`,
                  borderRight: `1px solid ${BDR}`, textAlign: 'left', whiteSpace: 'nowrap',
                }}>
                  客
                </th>
                {codes.map(code => (
                  <th
                    key={code}
                    colSpan={2}
                    style={{
                      position: 'sticky', top: 0, zIndex: 2, background: '#121D17', color: GOLD,
                      fontFamily: BRUSH, fontWeight: 800, padding: '7px 6px 4px', borderBottom: `1px solid ${BDR}`,
                      borderRight: `1px solid ${BDR}`, textAlign: 'center', whiteSpace: 'nowrap',
                    }}
                  >
                    {code}
                  </th>
                ))}
              </tr>
              <tr>
                <th style={{
                  position: 'sticky', left: 0, top: 29, zIndex: 3, background: '#121D17', color: SUB,
                  fontFamily: BRUSH, fontWeight: 700, fontSize: 10, padding: '2px 10px 7px',
                  borderBottom: `1px solid ${BDR}`, borderRight: `1px solid ${BDR}`, textAlign: 'left', whiteSpace: 'nowrap',
                }}>
                  &nbsp;
                </th>
                {codes.map(code => (
                  <Fragment key={code}>
                    <th style={{
                      position: 'sticky', top: 29, zIndex: 2, background: '#121D17', color: SUB,
                      fontFamily: BRUSH, fontWeight: 700, fontSize: 10, padding: '2px 6px 7px',
                      borderBottom: `1px solid ${BDR}`, textAlign: 'center', whiteSpace: 'nowrap',
                    }}>
                      シャ
                    </th>
                    <th style={{
                      position: 'sticky', top: 29, zIndex: 2, background: '#121D17', color: SUB,
                      fontFamily: BRUSH, fontWeight: 700, fontSize: 10, padding: '2px 6px 7px',
                      borderBottom: `1px solid ${BDR}`, borderRight: `1px solid ${BDR}`, textAlign: 'center', whiteSpace: 'nowrap',
                    }}>
                      ま
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.customer} style={{ background: i % 2 === 0 ? CARD : '#121D17' }}>
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? CARD : '#121D17', color: TEXT,
                    fontFamily: BRUSH, fontWeight: 700, padding: '7px 10px', borderRight: `1px solid ${BDR}`,
                    borderBottom: `1px solid ${BDR}`, whiteSpace: 'nowrap', textAlign: 'left',
                  }}>
                    {row.customer}
                  </th>
                  {codes.map(code => (
                    <Fragment key={code}>
                      <RankCell entry={row.shuffleRanks[code]} groupEnd={false} />
                      <RankCell entry={row.dealerRanks[code]} groupEnd={true} />
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
