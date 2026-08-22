import { formatYen } from '../storage';
import { GOLD, GOLDB, REDB, BDR, SUB, BRUSH } from '../theme';

interface Props {
  label: string;
  count: number;
  // 店収支ベースの金額（符号はこのまま色判定に使う）。
  amount: number;
  // trueのとき表示する数値だけ符号を反転する（客の勝敗表示など）。
  invert?: boolean;
}

export function DayGroupHeader({ label, count, amount, invert }: Props) {
  const displayValue = invert ? -amount : amount;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${BDR}`,
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: BRUSH, letterSpacing: '0.05em' }}>
        {label}（{count}シュート）
      </span>
      <span style={{
        fontSize: 15, fontWeight: 800, fontFamily: BRUSH,
        color: amount > 0 ? GOLDB : amount < 0 ? REDB : SUB,
      }}>
        {formatYen(displayValue)}円
      </span>
    </div>
  );
}
