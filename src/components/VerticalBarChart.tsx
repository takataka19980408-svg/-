import { C } from '../theme';
import { formatYenCompact } from '../storage';

export interface VBarItem {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  items: VBarItem[];
  height?: number;
  showAllLabels?: boolean;
  thresholdValue?: number | null;
  thresholdLabel?: string;
}

export function VerticalBarChart({
  items, height = 140, showAllLabels = true, thresholdValue, thresholdLabel,
}: Props) {
  const max = Math.max(...items.map(i => i.value), thresholdValue ?? 0, 1);
  const barCount = items.length;
  const labelEvery = showAllLabels ? 1 : Math.ceil(barCount / 8);
  const thresholdPct = thresholdValue ? Math.min((thresholdValue / max) * 100, 100) : null;

  return (
    <div>
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'flex-end', gap: barCount > 15 ? 2 : 6,
        height, borderBottom: `1px solid ${C.baseline}`, paddingBottom: 1,
      }}>
        {thresholdPct !== null && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: `${thresholdPct}%`,
            borderTop: `1.5px dashed ${C.danger}`, zIndex: 1,
          }}>
            {thresholdLabel && (
              <span style={{
                position: 'absolute', right: 0, top: -14, fontSize: 9, color: C.danger, fontWeight: 700,
              }}>
                {thresholdLabel}
              </span>
            )}
          </div>
        )}
        {items.map((item, idx) => {
          const pct = Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0);
          return (
            <div key={idx} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'flex-end', height: '100%', minWidth: barCount > 15 ? 3 : undefined,
            }}>
              <div style={{
                width: '100%', maxWidth: 26, height: `${pct}%`, borderRadius: '4px 4px 0 0',
                background: item.highlight ? C.brand : C.brandDim,
                border: item.highlight ? 'none' : `1px solid ${C.brandBorder}`,
                transition: 'height 0.25s ease',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: barCount > 15 ? 2 : 6, marginTop: 4 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            {idx % labelEvery === 0 && (
              <span style={{ fontSize: 9, color: C.textMuted }}>{item.label}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>
        最大 {formatYenCompact(max)}
      </div>
    </div>
  );
}
