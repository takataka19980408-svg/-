import { useState } from 'react';
import { GOLD, GOLDB, CARD, BDR, TEXT, SUB, BRUSH } from '../theme';

interface Props {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  onAdd: (v: string) => void;
  optional?: boolean;
}

export function MultiMasterPicker({ label, options, values, onChange, onAdd, optional }: Props) {
  const [showNew, setShowNew] = useState(options.length === 0);
  const [newVal, setNewVal] = useState('');

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };

  const commitNew = () => {
    const v = newVal.trim();
    if (!v) return;
    onAdd(v);
    onChange(values.includes(v) ? values : [...values, v]);
    setNewVal('');
    setShowNew(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', fontFamily: BRUSH, marginBottom: 6 }}>
        {label}{optional && <span style={{ color: SUB, fontWeight: 400 }}>（任意・複数選択可）</span>}
      </div>

      {options.length === 0 ? (
        <div style={{
          padding: '12px 14px', background: CARD, border: `1px solid ${BDR}`, borderRadius: 6,
          fontSize: 13, color: SUB, fontFamily: BRUSH,
        }}>
          まだ登録がありません。下の「＋」から追加してください
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {options.map(o => {
            const selected = values.includes(o);
            return (
              <button
                key={o}
                onClick={() => toggle(o)}
                style={{
                  padding: '8px 14px', borderRadius: 16, fontSize: 13, fontWeight: 700, fontFamily: BRUSH,
                  background: selected ? GOLD : CARD, border: `1px solid ${selected ? GOLD : BDR}`,
                  color: selected ? '#0A0900' : TEXT, cursor: 'pointer',
                }}
              >
                {selected ? '✓ ' : ''}{o}
              </button>
            );
          })}
        </div>
      )}

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
