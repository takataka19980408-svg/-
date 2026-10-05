import { Fragment, useState } from 'react';
import { getCustomerRankTable, getRecords, getRecordsForLastWeek, getRecordsForLastMonth } from '../storage';
import type { CustomerRankEntry } from '../storage';
import type { BaccaratRecord } from '../types';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH, DIGIT_FONT } from '../theme';

interface Props {
  onBack: () => void;
}

type RankPeriod = 'week' | 'month' | 'total';

// 早見表の中の3ページ（期間タブ）。週・月は「今日から遡ってn日」の
// ローリング集計、トータルは全期間。週・月だけ客の表示順をシュート数が
// 多い順にする（直近で頻繁に来ている客をすぐ探せるようにするため）。
const PERIODS: { id: RankPeriod; label: string; recordsFn: () => BaccaratRecord[]; orderByCount: boolean }[] = [
  { id: 'week',  label: '1週間',   recordsFn: getRecordsForLastWeek,  orderByCount: true },
  { id: 'month', label: '1ヶ月',   recordsFn: getRecordsForLastMonth, orderByCount: true },
  { id: 'total', label: 'トータル', recordsFn: getRecords,             orderByCount: false },
];

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
  const [period, setPeriod] = useState<RankPeriod>('week');
  const activePeriod = PERIODS.find(p => p.id === period) ?? PERIODS[0];
  const { codes, rows } = getCustomerRankTable(activePeriod.recordsFn(), activePeriod.orderByCount);

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

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
              background: period === p.id ? `${GOLD}18` : 'transparent',
              border: `1px solid ${period === p.id ? GOLD : BDR}`,
              color: period === p.id ? GOLDB : SUB, cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
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
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: SUB, fontFamily: DIGIT_FONT }}>
                      ({row.count})
                    </span>
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
