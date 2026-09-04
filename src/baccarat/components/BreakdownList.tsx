import type { AggregateItem } from '../storage';
import { formatYen } from '../storage';
import { BarChart } from './BarChart';
import { GOLD, GOLDB, REDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  title: string;
  items: AggregateItem[];
  showChart?: boolean;
  // trueのとき客本人の勝敗として表示する（数値の符号を反転）。色は
  // 店収支の符号のまま（店のプラス＝客の負け＝金色、店のマイナス＝
  // 客の勝ち＝赤）で変えない。
  invert?: boolean;
  // 渡すと各行がタップ可能になり、タップした項目のlabelを受け取る
  // （もう一度同じ項目をタップした場合もそのまま呼ばれる。トグルは
  // 呼び出し側の責任）。
  onSelect?: (label: string) => void;
  // 現在選択中の項目labelをハイライトする。
  selected?: string | null;
}

export function BreakdownList({ title, items, showChart, invert, onSelect, selected }: Props) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, fontFamily: BRUSH, margin: '16px 0 8px', letterSpacing: '0.05em' }}>
        {title}（{items.length}）
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: SUB, fontFamily: BRUSH, fontSize: 13, padding: '16px 0' }}>データがありません</div>
      ) : (
        <>
          {showChart && <BarChart items={items} invert={invert} />}
          {items.map(it => {
            const positive = it.storeProfit > 0;
            const negative = it.storeProfit < 0;
            const displayValue = invert ? -it.storeProfit : it.storeProfit;
            const isSelected = selected === it.label;
            return (
              <div
                key={it.label}
                onClick={onSelect ? () => onSelect(it.label) : undefined}
                style={{
                  background: isSelected ? `${GOLD}14` : CARD, border: `1px solid ${isSelected ? GOLD : BDR}`,
                  borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: onSelect ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: BRUSH }}>
                    {it.label}{onSelect && <span style={{ color: SUB, fontWeight: 400 }}> ›</span>}
                  </span>
                  <span style={{
                    fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
                    color: positive ? GOLDB : negative ? REDB : SUB,
                  }}>
                    {formatYen(displayValue)}円
                  </span>
                </div>
                <div style={{ fontSize: 11, color: SUB, fontFamily: BRUSH }}>
                  シュート数 {it.count}回
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
