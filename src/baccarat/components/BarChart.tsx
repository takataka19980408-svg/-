import type { AggregateItem } from '../storage';
import { formatYen } from '../storage';
import { GOLD, GOLDB, RED, REDB, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  items: AggregateItem[];
  onSelect?: (item: AggregateItem) => void;
  // trueのとき色の意味を反転する（客別: 客が勝った＝店がマイナス＝金色、
  // 客が負けた＝店がプラス＝赤）。店・ディーラー・シャッフル・期間別は
  // 通常どおり店収支プラス＝金色のまま。
  invert?: boolean;
}

export function BarChart({ items, onSelect, invert }: Props) {
  if (items.length === 0) return null;
  const maxAbs = Math.max(1, ...items.map(it => Math.abs(it.storeProfit)));

  return (
    <div style={{ marginBottom: 16 }}>
      {items.map(it => {
        const positive = invert ? it.storeProfit < 0 : it.storeProfit > 0;
        const negative = invert ? it.storeProfit > 0 : it.storeProfit < 0;
        const color = positive ? GOLD : negative ? RED : BDR;
        const colorB = positive ? GOLDB : negative ? REDB : SUB;
        const widthPct = (Math.abs(it.storeProfit) / maxAbs) * 100;
        return (
          <div
            key={it.label}
            onClick={onSelect ? () => onSelect(it) : undefined}
            style={{ marginBottom: 10, cursor: onSelect ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, gap: 8 }}>
              <span style={{
                fontSize: 12, color: TEXT, fontFamily: BRUSH, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {it.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: colorB, fontFamily: BRUSH, flexShrink: 0 }}>
                {formatYen(it.storeProfit)}円
              </span>
            </div>
            <div style={{ height: 8, background: BDR, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${widthPct}%`, minWidth: it.storeProfit !== 0 ? 4 : 0,
                background: color, borderRadius: '0 4px 4px 0',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
