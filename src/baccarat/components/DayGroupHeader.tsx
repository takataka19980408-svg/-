import { formatYen } from '../storage';
import { GOLD, GOLDB, REDB, BDR, SUB, BRUSH } from '../theme';

interface Props {
  label: string;
  count: number;
  // 店収支ベースの金額（符号はこのまま色判定に使う）。
  amount: number;
  // trueのとき表示する数値だけ符号を反転する（客の勝敗表示など）。
  invert?: boolean;
  // その日に登場した客ID（重複なし）の人数。渡された場合のみ表示する。
  customerCount?: number;
  // その日の全記録（このディーラー/シャッフルなどに絞らない）の店収支合計。
  // 渡された場合のみ、金額の下に小さく併記する。
  dayTotal?: number;
}

export function DayGroupHeader({ label, count, amount, invert, customerCount, dayTotal }: Props) {
  const displayValue = invert ? -amount : amount;
  return (
    <div style={{ marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${BDR}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: BRUSH, letterSpacing: '0.05em' }}>
          {label}（{count}シュート{customerCount !== undefined && `・入客${customerCount}人`}）
        </span>
        <span style={{
          fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
          color: amount > 0 ? GOLDB : amount < 0 ? REDB : SUB,
        }}>
          {formatYen(displayValue)}円
        </span>
      </div>
      {dayTotal !== undefined && (
        <div style={{ textAlign: 'right', fontSize: 11, color: SUB, fontFamily: BRUSH, marginTop: 2 }}>
          その日の全体収支 {formatYen(dayTotal)}円
        </div>
      )}
    </div>
  );
}
