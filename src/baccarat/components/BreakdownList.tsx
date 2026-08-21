import type { AggregateItem } from '../storage';
import { formatYen } from '../storage';
import { BarChart } from './BarChart';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  title: string;
  items: AggregateItem[];
  showChart?: boolean;
}

export function BreakdownList({ title, items, showChart }: Props) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        {title}（{items.length}）
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '16px 0' }}>データがありません</div>
      ) : (
        <>
          {showChart && <BarChart items={items} />}
          {items.map(it => (
            <div key={it.label} style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: BRUSH }}>{it.label}</span>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                  color: it.storeProfit > 0 ? GOLDB : it.storeProfit < 0 ? REDB : SUB,
                }}>
                  {formatYen(it.storeProfit)}円
                </span>
              </div>
              <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                対応 {it.count}回 スタート {it.startSum.toLocaleString()} エンド {it.endSum.toLocaleString()}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
