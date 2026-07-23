import type { MainScreen } from '../types';
import { C, NAV_H } from '../theme';

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? C.brand : C.textMuted} strokeWidth={2}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" strokeLinejoin="round" />
  </svg>
);
const HistoryIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? C.brand : C.textMuted} strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
  </svg>
);
const AnalysisIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? C.brand : C.textMuted} strokeWidth={2}>
    <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
  </svg>
);
const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={active ? C.brand : C.textMuted} strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Props {
  active: MainScreen;
  onChange: (s: MainScreen) => void;
  onRecord: () => void;
}

type NavItem = { id: MainScreen; label: string; Icon: React.FC<{ active: boolean }> };

const LEFT: NavItem[]  = [
  { id: 'home',    label: 'ホーム', Icon: HomeIcon },
  { id: 'history', label: '履歴',   Icon: HistoryIcon },
];
const RIGHT: NavItem[] = [
  { id: 'analysis', label: '分析', Icon: AnalysisIcon },
  { id: 'settings', label: '設定', Icon: SettingsIcon },
];

function Tab({ item, active, onChange }: { item: NavItem; active: boolean; onChange: (s: MainScreen) => void }) {
  return (
    <button
      onClick={() => onChange(item.id)}
      style={{
        flex: 1, padding: '9px 0 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      }}
    >
      <item.Icon active={active} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.brand : C.textMuted }}>
        {item.label}
      </span>
    </button>
  );
}

export function BottomNav({ active, onChange, onRecord }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, height: NAV_H,
      display: 'flex', alignItems: 'flex-end',
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {LEFT.map(item => (
        <Tab key={item.id} item={item} active={active === item.id} onChange={onChange} />
      ))}

      <button
        onClick={onRecord}
        style={{
          flex: 0, width: 76,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingBottom: 8, position: 'relative',
        }}
      >
        <span style={{
          width: 54, height: 54, borderRadius: '50%',
          background: C.brand, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(42,120,214,0.45)',
          marginTop: -14,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.brand, marginTop: 3 }}>記録</span>
      </button>

      {RIGHT.map(item => (
        <Tab key={item.id} item={item} active={active === item.id} onChange={onChange} />
      ))}
    </nav>
  );
}
