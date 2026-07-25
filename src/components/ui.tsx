import type { ReactNode } from 'react';
import { C, FONT } from '../theme';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 13, background: C.brand, borderRadius: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.08em', fontFamily: FONT }}>
          {children}
        </span>
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card style={{ padding: '28px 16px', textAlign: 'center' }}>
      <span style={{ fontSize: 13, color: C.textMuted, fontFamily: FONT }}>{children}</span>
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
        fontSize: 16, fontWeight: 800, letterSpacing: '0.15em', fontFamily: FONT,
        background: disabled ? C.baseline : `linear-gradient(135deg,${C.brand} 0%,${C.brandBright} 100%)`,
        color: disabled ? C.textMuted : '#1a1408',
        boxShadow: disabled ? 'none' : '0 4px 18px rgba(201,162,39,0.35)',
        border: `1px solid ${C.brandBorder}`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
