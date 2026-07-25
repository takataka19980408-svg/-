import { C, FONT } from '../theme';
import { formatYen } from '../storage';

export interface BarListItem {
  label: string;
  value: number;
  count?: number;
  colorVar?: string;
}

interface Props {
  items: BarListItem[];
  limit?: number;
}

const MEDAL = ['#F5D060', '#C9C4B4', '#C97B3D'];

export function BarList({ items, limit = 10 }: Props) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map(i => i.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {shown.map((item, idx) => {
        const pct = Math.max((item.value / max) * 100, 2);
        const rankColor = idx < 3 ? MEDAL[idx] : C.textMuted;
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: rankColor, width: 16, flexShrink: 0, fontFamily: FONT }}>
                {idx + 1}
              </span>
              <span style={{
                fontSize: 13, color: C.text, flex: 1, minWidth: 0, fontFamily: FONT,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: idx < 3 ? MEDAL[idx] : C.text, flexShrink: 0, fontFamily: FONT }}>
                {formatYen(item.value)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 22 }}>
              <div style={{ flex: 1, height: 8, background: C.card2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 4,
                  background: item.colorVar ?? `linear-gradient(90deg,${C.brand},${C.brandBright})`,
                }} />
              </div>
              {item.count !== undefined && (
                <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0, fontFamily: FONT }}>{item.count}件</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
