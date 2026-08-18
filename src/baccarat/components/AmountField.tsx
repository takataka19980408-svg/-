import { useState } from 'react';
import { GOLD, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

const QUICK = [1000, 10000, 50000, 100000, 500000, 1000000];

function fmt(n: number): string {
  if (n === 0) return '0';
  if (n >= 10000) {
    const man = Math.floor(n / 10000);
    const rem = n % 10000;
    return rem === 0 ? `${man}万` : `${man}万${rem.toLocaleString()}`;
  }
  return n.toLocaleString();
}

interface Props {
  label: string;
  amount: number;
  onAdd: (n: number) => void;
  onReset: () => void;
  accent: string;
}

export function AmountField({ label, amount, onAdd, onReset, accent }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customRaw, setCustomRaw] = useState('');

  const applyCustom = () => {
    const n = parseInt(customRaw.replace(/[^0-9]/g, ''), 10) || 0;
    if (n > 0) onAdd(n);
    setCustomRaw('');
    setShowCustom(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ background: CARD, border: `2px solid ${BDR}`, borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: SUB, fontFamily: BRUSH, marginBottom: 4 }}>累計</div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: BRUSH, color: amount > 0 ? TEXT : `${TEXT}33` }}>
          ¥{fmt(amount)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 6 }}>
        {QUICK.map(a => (
          <button
            key={a}
            onClick={() => onAdd(a)}
            style={{
              padding: '10px 0', borderRadius: 5, fontSize: 14, fontWeight: 800, fontFamily: BRUSH,
              background: `${accent}0D`, border: `1px solid ${accent}30`, color: accent, cursor: 'pointer',
            }}
          >
            {a >= 10000 ? `${a / 10000}万` : a.toLocaleString()}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setShowCustom(v => !v)}
          style={{
            flex: 1, padding: '9px', borderRadius: 5, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
            background: showCustom ? `${accent}18` : CARD, border: `1px solid ${showCustom ? accent : BDR}`,
            color: showCustom ? accent : SUB, cursor: 'pointer',
          }}
        >
          その他の金額
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '9px 16px', borderRadius: 5, fontSize: 12, fontWeight: 700, fontFamily: BRUSH,
            background: '#3A140F', border: '1px solid #6B241966', color: '#FF7A5C', cursor: 'pointer',
          }}
        >
          リセット
        </button>
      </div>
      {showCustom && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            type="number" value={customRaw} autoFocus
            onChange={e => setCustomRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            placeholder="金額を入力"
            style={{
              flex: 1, padding: '10px 12px', background: CARD, border: `1px solid ${accent}`, borderRadius: 6,
              fontSize: 16, color: TEXT, fontFamily: BRUSH, outline: 'none',
            }}
          />
          <button
            onClick={applyCustom}
            style={{
              padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: accent, color: '#0A0900', border: 'none', cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}
