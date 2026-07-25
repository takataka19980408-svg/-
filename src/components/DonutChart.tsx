import { C, FONT } from '../theme';
import { formatYen } from '../storage';

export interface DonutItem {
  label: string;
  value: number;
  colorVar: string;
}

interface Props {
  items: DonutItem[];
  centerLabel?: string;
  size?: number;
}

const GAP_DEG = 2.5; // angular gap between segments, standing in for the 2px surface gap rule

export function DonutChart({ items, centerLabel, size = 172 }: Props) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const visible = items.filter(i => i.value > 0);

  let gradient = `${C.card2} 0deg 360deg`;
  if (total > 0 && visible.length > 0) {
    let angle = 0;
    const stops: string[] = [];
    visible.forEach(item => {
      const sweep = (item.value / total) * 360;
      const start = angle + (visible.length > 1 ? GAP_DEG / 2 : 0);
      const end = angle + sweep - (visible.length > 1 ? GAP_DEG / 2 : 0);
      stops.push(`${item.colorVar} ${start}deg ${Math.max(start, end)}deg`);
      angle += sweep;
    });
    gradient = stops.join(', ');
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{
        position: 'relative', width: size, height: size, flexShrink: 0,
        borderRadius: '50%',
        background: `conic-gradient(${gradient})`,
      }}>
        <div style={{
          position: 'absolute', inset: size * 0.19,
          borderRadius: '50%', background: C.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          <span style={{ fontSize: 10, color: C.textMuted, marginBottom: 2, fontFamily: FONT, letterSpacing: '0.1em' }}>合計</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.brandBright, lineHeight: 1.2, textAlign: 'center', fontFamily: FONT }}>
            {centerLabel ?? formatYen(total)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 120 }}>
        {visible.slice(0, 8).map(item => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 9, height: 9, borderRadius: 2.5, background: item.colorVar, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 12, color: C.textSecondary, flex: 1, minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT,
              }}>
                {item.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flexShrink: 0, fontFamily: FONT }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
