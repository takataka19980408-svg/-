import type { MainScreen } from '../types';

const GOLD     = '#C9A227';
const GOLDB    = '#F5D060';
const GOLDD    = '#7A5C00';
const INACTIVE = '#383020';
const BRUSH    = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

// ── Icons ──────────────────────────────────────────────────────
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : INACTIVE}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);
const HistoryIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : INACTIVE}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
  </svg>
);
const AnalysisIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : INACTIVE}>
    <path d="M5 20h2v-5H5v5zm4 0h2v-9H9v9zm4 0h2v-3h-2v3zm4 0h2V4h-2v16z"/>
  </svg>
);
const RankingIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : INACTIVE}>
    <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 17l-6.18 3.02L7 13.14 2 8.27l6.91-1.01L12 1z"/>
  </svg>
);
const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GOLD : INACTIVE}>
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────
interface Props {
  active: MainScreen;
  onChange: (s: MainScreen) => void;
  onRecord: () => void;
}

type NavItem = { id: MainScreen; label: string; Icon: React.FC<{ active: boolean }> };

const LEFT: NavItem[]  = [
  { id: 'home',    label: 'ホーム', Icon: HomeIcon    },
  { id: 'history', label: '履歴',   Icon: HistoryIcon },
];
const RIGHT: NavItem[] = [
  { id: 'analysis', label: '分析', Icon: AnalysisIcon },
  { id: 'ranking',  label: '順位', Icon: RankingIcon  },
  { id: 'settings', label: '設定', Icon: SettingsIcon },
];

function Tab({ item, active, onChange }: { item: NavItem; active: boolean; onChange: (s: MainScreen) => void }) {
  return (
    <button
      onClick={() => onChange(item.id)}
      style={{
        flex: 1, padding: '10px 0 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
    >
      <item.Icon active={active} />
      <span style={{
        fontSize: 10, fontWeight: active ? 700 : 400,
        color: active ? GOLD : INACTIVE,
        fontFamily: BRUSH, letterSpacing: '0.05em',
      }}>
        {item.label}
      </span>
    </button>
  );
}

// ── BottomNav ──────────────────────────────────────────────────
export function BottomNav({ active, onChange, onRecord }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      display: 'flex', alignItems: 'flex-end',
      background: '#0D0C08',
      borderTop: '1px solid #1E1C10',
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* 左タブ */}
      {LEFT.map(item => (
        <Tab key={item.id} item={item} active={active === item.id} onChange={onChange} />
      ))}

      {/* 中央：記録ボタン */}
      <div style={{
        flex: 0, width: 76,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingBottom: 6, position: 'relative',
      }}>
        <button
          onClick={onRecord}
          style={{
            width: 58, height: 58,
            borderRadius: '50%',
            background: `linear-gradient(145deg,${GOLDD},${GOLD} 45%,${GOLDB})`,
            border: `2px solid ${GOLDB}60`,
            color: '#0A0900',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            boxShadow: `0 0 18px ${GOLD}60, 0 4px 16px rgba(0,0,0,0.5)`,
            cursor: 'pointer',
            marginTop: -16,  /* 上にはみ出す */
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: 22, lineHeight: 1, fontFamily: BRUSH, color: '#0A0900' }}>◆</span>
        </button>
        <span style={{
          fontSize: 10, fontWeight: 800, color: GOLD,
          fontFamily: BRUSH, letterSpacing: '0.08em', marginTop: 3,
        }}>
          記録
        </span>
      </div>

      {/* 右タブ */}
      {RIGHT.map(item => (
        <Tab key={item.id} item={item} active={active === item.id} onChange={onChange} />
      ))}
    </nav>
  );
}
