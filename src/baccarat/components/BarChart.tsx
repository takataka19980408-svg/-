import type { AggregateItem } from '../storage';
import { formatYen } from '../storage';
import { GOLD, GOLDB, RED, REDB, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  items: AggregateItem[];
  onSelect?: (item: AggregateItem) => void;
  // trueのとき客本人の勝敗として表示する（数値の符号を反転：客が勝った
  // ＝店収支はマイナスだが表示は客のプラス）。色は店収支の符号のまま
  // （店がプラス＝店の勝ち＝客の負け＝金色、店がマイナス＝客の勝ち＝赤）
  // なので色のロジック自体はinvertしない。
  invert?: boolean;
  // trueのとき色を表示値（invert後の値）の符号で決める（マイナス＝赤）。
  // 省略時は従来どおり店収支の符号のまま色を決める。
  colorByDisplay?: boolean;
}

export function BarChart({ items, onSelect, invert, colorByDisplay }: Props) {
  if (items.length === 0) return null;
  const maxAbs = Math.max(1, ...items.map(it => Math.abs(it.storeProfit)));

  return (
    <div style={{ marginBottom: 16 }}>
      {items.map(it => {
        const displayValue = invert ? -it.storeProfit : it.storeProfit;
        const signValue = colorByDisplay ? displayValue : it.storeProfit;
        const positive = signValue > 0;
        const negative = signValue < 0;
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
                {formatYen(displayValue)}円
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
