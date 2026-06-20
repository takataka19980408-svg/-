export const GAME_W = 360;
export const GAME_H = 640;
export const TILE = 16;
export const SCALE = 2;
export const TILE_PX = TILE * SCALE; // 32px on screen

// Bottom UI height (virtual pad area)
export const UI_H = 160;
// Map view height
export const MAP_H = GAME_H - UI_H; // 480

// Tiles visible in viewport
export const VP_W = Math.floor(GAME_W / TILE_PX);  // 11
export const VP_H = Math.floor(MAP_H / TILE_PX);   // 15

// Tile type constants
export const T = {
  GRASS: 0,
  TREE:  1,
  WALL:  2,
  FLOOR: 3,
  PATH:  4,
  WATER: 5,
  ROCK:  6,
  DOOR:  7,
  DIRT:  8,
  CAVE:  9,
};

// Tile passability (true = can walk)
export const PASSABLE = {
  [T.GRASS]: true,
  [T.TREE]:  false,
  [T.WALL]:  false,
  [T.FLOOR]: true,
  [T.PATH]:  true,
  [T.WATER]: false,
  [T.ROCK]:  false,
  [T.DOOR]:  true,
  [T.DIRT]:  true,
  [T.CAVE]:  true,
};

// Tile colors (for placeholder rendering)
export const TILE_COLOR = {
  [T.GRASS]: 0x2d5a1b,
  [T.TREE]:  0x1a3d10,
  [T.WALL]:  0x7a6040,
  [T.FLOOR]: 0xc8a87a,
  [T.PATH]:  0xa09060,
  [T.WATER]: 0x2255aa,
  [T.ROCK]:  0x888888,
  [T.DOOR]:  0x8b4513,
  [T.DIRT]:  0x9b7a4a,
  [T.CAVE]:  0x333333,
};

export const TILE_BORDER = {
  [T.GRASS]: 0x264d18,
  [T.TREE]:  0x0d2008,
  [T.WALL]:  0x5a4428,
  [T.FLOOR]: 0xb09868,
  [T.PATH]:  0x887840,
  [T.WATER]: 0x1a3d88,
  [T.ROCK]:  0x666666,
  [T.DOOR]:  0x5a2d0c,
  [T.DIRT]:  0x7a5a30,
  [T.CAVE]:  0x111111,
};

// Colors
export const COLOR = {
  BG:         0x0a0a18,
  UI_BG:      0x0d0d20,
  WIN_BG:     0x0a0a22,
  WIN_BORDER: 0x4466aa,
  TEXT:       0xddeeff,
  TEXT_DIM:   0x8899bb,
  CURSOR:     0xffffff,
  HP_BAR:     0x22dd44,
  HP_LOW:     0xdd4422,
  MP_BAR:     0x4488ff,
  VOICE:      0xaaddff,
  GOLD:       0xffdd66,
  CHAPTER:    0x8899dd,
};
