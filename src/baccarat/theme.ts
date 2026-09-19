export const FELT   = '#0B3D2E';
export const FELTD  = '#062319';
export const GOLD   = '#C9A227';
export const GOLDB  = '#F5D060';
export const RED    = '#9B1C10';
export const REDB   = '#FF3300';
export const CARD   = '#0E1712';
export const BDR    = '#1E2B24';
export const TEXT   = '#EDE3C0';
export const SUB    = '#5A6B62';
export const BRUSH  = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
export const NAV_H  = 60;
// ボトムナビ自体はセーフエリア分の余白を追加で持つため、ナビの上に
// 固定配置する要素はこちらでナビの実高さ分だけ浮かせる。
export const NAV_SAFE_BOTTOM = `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))`;
