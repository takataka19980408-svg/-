import { useState } from 'react';
import { GOLD, GOLDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  onAdd: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
}

export function MasterPicker({ label, options, value, onChange, onAdd, placeholder, optional }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [newVal, setNewVal] = useState('');

  const commitNew = () => {
    const v = newVal.trim();
    if (!v) return;
    onAdd(v);
    onChange(v);
    setNewVal('');
    setShowNew(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
        {label}{optional && <span style={{ color: SUB, fontWeight: 400 }}>（任意）</span>}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 10px', background: CARD,
          border: `1px solid ${BDR}`, borderRadius: 6,
          fontSize: 15, fontWeight: 600, color: value ? TEXT : SUB,
          fontFamily: BRUSH, appearance: 'none', WebkitAppearance: 'none', colorScheme: 'dark',
        }}
      >
        <option value="" style={{ background: '#0a0f0c' }}>{placeholder ?? '選択してください'}</option>
        {options.map(o => (
          <option key={o} value={o} style={{ background: '#0a0f0c' }}>{o}</option>
        ))}
      </select>
      <button
        onClick={() => setShowNew(v => !v)}
        style={{
          marginTop: 8, fontSize: 12, color: showNew ? GOLDB : SUB, fontWeight: 700,
          background: 'none', border: 'none', fontFamily: BRUSH, cursor: 'pointer', padding: 0,
        }}
      >
        ＋ 新しい{label}を追加
      </button>
      {showNew && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            type="text" value={newVal} autoFocus
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && commitNew()}
            placeholder={`新しい${label}を入力`}
            style={{
              flex: 1, padding: '10px 12px', background: '#0a0f0c',
              border: `1px solid ${GOLD}55`, borderRadius: 6,
              fontSize: 14, color: TEXT, fontFamily: BRUSH, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={commitNew}
            style={{
              padding: '10px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
              background: GOLD, color: '#0A0900', border: 'none', cursor: 'pointer',
            }}
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}
