import type { BaccaratScreen } from '../types';
import { GOLD, GOLDB, SUB, BRUSH, FELTD, BDR } from '../theme';

interface Props {
  active: BaccaratScreen;
  onChange: (s: BaccaratScreen) => void;
}

const ITEMS: { id: BaccaratScreen; label: string; icon: string }[] = [
  { id: 'record',  label: '入力', icon: '✎' },
  { id: 'history', label: '履歴', icon: '☰' },
  { id: 'summary', label: '集計', icon: '◆' },
  { id: 'masters', label: 'マスタ', icon: '⚙' },
];

export function BaccaratBottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, margin: '0 auto',
      width: '100%', maxWidth: 480,
      display: 'flex',
      background: FELTD,
      borderTop: `1px solid ${BDR}`,
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          style={{
            flex: 1, padding: '10px 0 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 19, color: active === item.id ? GOLD : SUB }}>{item.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: active === item.id ? 700 : 400,
            color: active === item.id ? GOLDB : SUB,
            fontFamily: BRUSH, letterSpacing: '0.05em',
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
