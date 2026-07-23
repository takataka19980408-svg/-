import type { ReactNode } from 'react';
import { C } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>
        {children}
      </span>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card style={{ padding: '28px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{children}</span>
    </Card>
  );
}

export function PrimaryButton({
  children, onClick, disabled, style,
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px', borderRadius: 12,
        fontSize: 15, fontWeight: 700,
        background: disabled ? C.baseline : C.brand,
        color: '#ffffff',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
