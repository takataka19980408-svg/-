import { GOLD, CARD, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  label: string;
  amount: number;
  onChange: (n: number) => void;
  accent: string;
}

export function AmountField({ label, amount, onChange, accent }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: CARD, border: `2px solid ${accent}55`, borderRadius: 8, padding: '10px 14px',
      }}>
        <input
          type="number" inputMode="numeric" min="0" value={amount === 0 ? '' : amount}
          onChange={e => onChange(parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
          placeholder="0"
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 26, fontWeight: 800, color: TEXT, fontFamily: BRUSH, textAlign: 'right', padding: 0,
          }}
        />
        <span style={{ fontSize: 13, color: SUB, fontFamily: BRUSH, flexShrink: 0 }}>円</span>
      </div>
    </div>
  );
}
