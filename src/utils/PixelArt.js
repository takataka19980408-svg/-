/**
 * PixelArt.js
 * スプライトを文字配列で定義し、Phaser Graphicsで1px単位描画する。
 * 各スプライトは 16×16 の文字列配列。'.'=透明。
 */

// ─── 共通カラーパレット ────────────────────────────────────────────
export const PAL = {
  // アウトライン・基本
  '.': null,
  'K': 0x111111,
  'k': 0x2a2a2a,

  // サトシ
  'F': 0xf5c99a,   // 肌
  'f': 0xd4956a,   // 肌影
  'H': 0x1a1020,   // 髪ダーク
  'h': 0x2d1e2e,   // 髪ミッド
  'B': 0x1a44b8,   // 青ジャケット
  'b': 0x2c58d4,   // 青ライト
  'P': 0x0e2c80,   // 青シャドウ
  'N': 0x151e30,   // ネイビーパンツ
  'n': 0x1e2840,   // ネイビーライト
  'E': 0x221000,   // 靴ダーク
  'e': 0x3a1e06,   // 靴ミッド
  'W': 0xffffff,   // 白（目）
  'C': 0xe8e8f8,   // 白カラー

  // モフ
  'M': 0xe0c090,   // 体色
  'm': 0xc8a870,   // 体影
  'O': 0xf0b870,   // 体ハイライト
  'o': 0xff8870,   // 鼻
  'A': 0x7a5030,   // 暗部・耳

  // 老人・NPCバリエーション
  'G': 0xaaaaaa,   // 白髪グレー
  'g': 0xdddddd,   // 白髪ライト
  'R': 0xaa3322,   // 赤み（お母さん服）
  'r': 0x881a10,   // 赤影
  'V': 0x446688,   // 村人青
  'v': 0x2a4466,   // 村人青影

  // タイル - 草
  '1': 0x3a7a22,   // 草ベース
  '2': 0x4a9028,   // 草ライト
  '3': 0x2a5a14,   // 草ダーク
  '4': 0x5aaa30,   // 草ハイライト

  // タイル - 木
  '5': 0x224a10,   // 木ダーク
  '6': 0x336618,   // 木ミッド
  '7': 0x4a8820,   // 木ライト
  '8': 0x6b4020,   // 幹茶色
  '9': 0x8b5a2a,   // 幹ライト

  // タイル - 石壁
  'a': 0x8a7a60,   // 石ベース
  'c': 0x6a5a42,   // 石ダーク
  'd': 0xaa9a78,   // 石ライト
  'i': 0x4a3a24,   // 石モルタル

  // タイル - 床（木板）
  'j': 0xc8946a,   // 板ベース
  'l': 0xaa7848,   // 板ダーク
  'p': 0xe0aa7a,   // 板ライト

  // タイル - 道
  'q': 0x9a8860,   // 道ベース
  's': 0x7a6844,   // 道ダーク
  't': 0xb8a070,   // 道ライト
  'u': 0x6a5a38,   // 道小石

  // タイル - 水
  'w': 0x2255aa,   // 水ベース
  'x': 0x1a3d88,   // 水ダーク
  'y': 0x4477cc,   // 水ライト
  'z': 0x88aaee,   // 水ハイライト

  // タイル - 岩
  'D': 0x887860,   // 岩ベース
  'I': 0x6a5a4a,   // 岩ダーク
  'J': 0xaa9878,   // 岩ライト
};

// ─── スプライト定義 ───────────────────────────────────────────────

// サトシ (16×16, 正面)
export const SATOSHI = [
  '................',
  '.....KKKKKK.....',
  '....KHHhHHHK....',
  '....KHhhhhHK....',
  '....KFFFFFFk....',
  '....KFWKKWFk....',   // 目
  '....KFFFFFfk....',
  '....KFffFFFk....',   // 口付近
  '..kKCBbbBBCKk...',   // カラー
  '..KPBbbBBBBPK..',    // ジャケット
  '..KPBBBBBBBPk..',
  '..KPBBBBBBBPk..',
  '...KNNkKkNNk...',    // パンツ
  '...KNNk.kNNk...',
  '...KEEk.kEEk...',    // 靴
  '....Kk...kK.....',
];

// モフ (16×16, 正面)
export const MOFU = [
  '..KAK......KAK..',   // 耳
  '.KAAkK....KkAAk.',
  '.KAmAK....KAmAK.',
  '...KMMMMMMMk....',
  '..KOMMmMmMMOK...',
  '.KOMMmMMmMMMOk..',
  '.KMMKoKoKMMMk..',    // 目
  '.KMMMKoKMMMMk..',    // 鼻
  '.KMMmmMMmMMk....',
  '..KMMMMMMMk.....',
  '...KmMmMmk......',
  '..KAK.KKAk......',   // 脚
  '.KAmK..KmAK.....',
  '.KAAk..KAAk.....',
  '.Kkk....kkK.....',
  '................',
];

// 村長 (16×16)
export const ELDER = [
  '................',
  '....KGGGGGk.....',
  '...KGgggggGK....',
  '...KGGgggGGK....',
  '...KFFFFFFk.....',
  '...KFfWKWfk.....',   // 目 (ひげ込み)
  '...KFfffFFk.....',
  '...KFGGGFFk.....',   // ひげ
  '...KaaccaaK.....',   // 服（茶色）
  '..KcaaccaacK....',
  '..KaaccccaaK....',
  '..KaaaaaaaK.....',
  '...KcaKKacK.....',
  '...Kcak.kcK.....',
  '...KeEk.kEe.....',
  '....Kk...K......',
];

// お母さん (16×16)
export const MOM = [
  '................',
  '....KKKKKK......',
  '...KhhhhhK......',
  '...KhHHhhK......',
  '...KFFFFFFk.....',
  '...KFWKKWfk.....',
  '...KFFFFFfk.....',
  '...KFffFFFk.....',
  '..KCRrrRRCK.....',    // 赤い服
  '.KrRrrRRRrRK....',
  '.KrRRRRRRrrK....',
  '.KrRrrRRRrRK....',
  '..KNNkKkNNK.....',
  '..KNNk.kNNK.....',
  '..KEEk.kEEK.....',
  '...KK...KK......',
];

// 村人A（青服）
export const VILLAGER_A = [
  '................',
  '....KKKKKK......',
  '...KhhhhhK......',
  '...KhhHHhK......',
  '...KFFFFFFk.....',
  '...KFWKKWFk.....',
  '...KFFFFFfk.....',
  '...KFfffFFk.....',
  '..KCVvvVVCK.....',
  '.KvVvvVVVvVK....',
  '.KvVVVVVVvvK....',
  '.KvVvvVVVvVK....',
  '..KNNkKkNNK.....',
  '..KNNk.kNNK.....',
  '..KEEk.kEEK.....',
  '...KK...KK......',
];

// ─── タイルスプライト (16×16) ─────────────────────────────────────

export const TILE_GRASS = [
  '1211112112111211',
  '1122111221121121',
  '2112114112111222',
  '1121122111211121',
  '1211141121121211',
  '2121121211214121',
  '1211211422112111',
  '1122121121121221',
  '2112121211221121',
  '1121124121121211',
  '1211121221211121',
  '2111211421112122',
  '1221112121122111',
  '1112121211211221',
  '2121211121122112',
  '1211121121121121',
];

export const TILE_TREE = [
  '3333333333333333',
  '3355666655553333',
  '3567777777765333',
  '3677744477775333',
  '3677474747775333',
  '5677747477775333',
  '5677777777765333',
  '5677744477765333',
  '3567777777753333',
  '3355566655533333',
  '3338888833333333',
  '3338899833333333',
  '3338888833333333',
  '3338888833333333',
  '3333333333333333',
  '3333333333333333',
];

export const TILE_WALL = [
  'iiiiiiiiiiiiiiii',
  'iadddddaiadddddai',  // 長すぎるので16に合わせる
  'iaddddaiiaddddai',
  'iaddddaiiaddddai',
  'iadddddaiadddddai',
  'iiiiiiiiiiiiiiii',
  'iadddddddddddddai',
  'iadddddddddddddai',
  'iadddddddddddddai',
  'iiiiiiiiiiiiiiii',
  'iadddddaiadddddai',
  'iadddddaiadddddai',
  'iadddddaiadddddai',
  'iadddddaiadddddai',
  'iiiiiiiiiiiiiiii',
  'iiiiiiiiiiiiiiii',
];

// 壁は16文字に修正
export const TILE_WALL_FIXED = [
  'iiiiiiiiiiiiiiii',
  'iadddaiiaddddaii',
  'iadddaiiaddddaii',
  'iadddaiiaddddaii',
  'iiiiiiiiiiiiiiii',
  'iadddddddddddaii',
  'iadddddddddddaii',
  'iiiiiiiiiiiiiiii',
  'iadddaiiaddddaii',
  'iadddaiiaddddaii',
  'iadddaiiaddddaii',
  'iiiiiiiiiiiiiiii',
  'iadddddddddddaii',
  'iadddddddddddaii',
  'iiiiiiiiiiiiiiii',
  'cccccccccccccccc',
];

export const TILE_FLOOR = [
  'llllllllllllllll',
  'ljpppppppppppplj',
  'ljpplppppplpplj.',
  'ljppppppppppplj.',
  'lljpppppppppljl.',
  'llllllllllllllll',
  'ljpppppppppppplj',
  'ljpplppppplpplj.',
  'ljppppppppppplj.',
  'lljpppppppppljl.',
  'llllllllllllllll',
  'ljpppppppppppplj',
  'ljpplppppplpplj.',
  'ljppppppppppplj.',
  'lljpppppppppljl.',
  'llllllllllllllll',
];

export const TILE_PATH = [
  'qqsqqtqsqqqtqqqq',
  'qtqqqqsqtqqqsqqq',
  'qsquqqqqqsqtqqqq',
  'qqqqtqsqqqqsqqqq',
  'qsqqqquqtqqqqqqs',
  'qqtqqqqssqtqqsqq',
  'qqqsqqtqqqsqtqqq',
  'qtqqqsqqtqqqsqqq',
  'qqsqtqqqqqsqtqqq',
  'qqqqqsqtqsqqqqqs',
  'qtqqqqsqqqqtqqqq',
  'qsquqqqqqsqtqqqq',
  'qqqqtqsqqqqsqqqq',
  'qsqqqqtqsqqqqqqt',
  'qqtqsqqsqtqqsqqq',
  'qqqsqqtqqqsqtqqq',
];

export const TILE_WATER = [
  'xxwwwxxxxwwwxxxx',
  'xywwwyxxxywwwyxx',
  'xyywwwyxxywwwyxx',
  'xzywwwyxyywwwyxx',
  'xxzywwwyzywwwzxx',
  'xxxzywwwzzwwwzxx',
  'xxxxzywwwywwwzxx',
  'xxxxxzywwyywwzxx',
  'xxxxwwywwyywwwxx',
  'xxxwwwyyzywwwyxx',
  'xxywwyyzzzywwyxx',
  'xywwyxxxzzywwyxx',
  'xwwyxxxxzywwyxxx',
  'xwwwxxxxxywwwxxx',
  'ywwwyxxxxywwwyxx',
  'ywwwwxxxywwwwxxx',
];

export const TILE_ROCK = [
  '................',
  '...KKKKKKK......',
  '..KJJJJJJJk.....',
  '.KJJIJJJJJJk....',
  '.KJJIIDJJJJk....',
  '.KJIIDDDJJJk....',
  '.KJIIDDDDJJk....',
  '.KJJIDDDJJJk....',
  '.KJJJDDJJJJk....',
  '.KJJJJJJJJJk....',
  '..KJJJJJJJk.....',
  '...KKKKKKk......',
  '................',
  '................',
  '................',
  '................',
];

export const TILE_DOOR = [
  '..KKKKKKKKKK....',
  '..KaaacaaacK....',
  '..KaaccaaacK....',
  '..KaacKKKaak....',
  '..KaaKJJKaaK....',  // 扉枠
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KaKJKKJKaK....',  // 取っ手付近
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KaKJJJJKaK....',
  '..KKKKKKKKKk....',
  '................',
];

export const TILE_DIRT = [
  'sssssssssssssssq',
  'qqtqsqqsqtqqsqqq',
  'qsqqqquqtqqqqqqs',
  'qqtqqqqssqtqqsqq',
  'qqqsqqtqqqsqtqqq',
  'qtqqqsqqtqqqsqqq',
  'qqsqtqqqqqsqtqqq',
  'qqqqqsqtqsqqqqqs',
  'qtqqqqsqqqqtqqqq',
  'qsquqqqqqsqtqqqq',
  'qqqqtqsqqqqsqqqq',
  'qsqqqqtqsqqqqqqt',
  'qqtqsqqsqtqqsqqq',
  'qqqsqqtqqqsqtqqq',
  'qqsqtqqqqqsqtqqq',
  'qqqqsqssqqssqqqq',
];

export const TILE_CAVE = [
  'KKKKKKKKKKKKKKK.',
  'KKKKKKKKKKKKKKK.',
  'KKkkkkkkkkkkKKK.',
  'KKkKKKKKKKKkKK..',
  'KKkKKKKKKKKkKK..',
  'KKkKK.....KkKK..',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkK.......KkK...',
  'KKkKKKKKKKKkKKK.',
  'KKKKKKKKKKKKKKK.',
  'KKKKKKKKKKKKKKK.',
];

// ─── バトルスプライト (より大きいサイズ) ─────────────────────────

// プニ(48×40) - キャラクター定義は幅広文字列
export const PUNI_SMALL_ART = {
  w: 48, h: 40,
  fn: (g) => {
    // 影
    drawEllipse(g, 24, 36, 32, 8, 0x223355, 0.5);
    // 体メイン
    drawEllipse(g, 24, 22, 36, 30, 0x7799ee);
    drawEllipse(g, 24, 20, 30, 24, 0x99bbff);
    // ハイライト
    drawEllipse(g, 19, 14, 10, 8, 0xccddff, 0.6);
    // 目
    drawCircle(g, 17, 20, 4, 0x111133);
    drawCircle(g, 17, 20, 2, 0xffffff);
    drawCircle(g, 18, 19, 1, 0x6688ff);
    drawCircle(g, 31, 20, 4, 0x111133);
    drawCircle(g, 31, 20, 2, 0xffffff);
    drawCircle(g, 32, 19, 1, 0x6688ff);
    // 口
    drawLine(g, 20, 26, 28, 26, 0x334488, 2);
    drawLine(g, 20, 26, 17, 28, 0x334488, 2);
    drawLine(g, 28, 26, 31, 28, 0x334488, 2);
    // ゼリー質感ライン
    drawLine(g, 16, 10, 14, 18, 0xaabbff, 1);
  },
};

export const KUSA_MUSHA_ART = {
  w: 48, h: 56,
  fn: (g) => {
    // 影
    drawEllipse(g, 24, 52, 32, 6, 0x112200, 0.4);
    // 体 (緑の鎧)
    drawEllipse(g, 24, 36, 28, 34, 0x1a4a10);
    drawEllipse(g, 24, 33, 22, 26, 0x2a6a1a);
    // 頭/兜
    drawEllipse(g, 24, 16, 20, 18, 0x1a4a10);
    drawEllipse(g, 24, 14, 16, 14, 0x3a7a22);
    // 角
    fillRect(g, 20, 4, 4, 10, 0x4a9028);
    fillRect(g, 24, 2, 4, 12, 0x5aaa30);
    // 目（光る赤）
    drawCircle(g, 18, 16, 3, 0x220000);
    drawCircle(g, 18, 16, 2, 0xcc2200);
    drawCircle(g, 30, 16, 3, 0x220000);
    drawCircle(g, 30, 16, 2, 0xcc2200);
    // 腕（葉の剣）
    fillRect(g, 4, 28, 8, 3, 0x224a12);
    fillRect(g, 36, 28, 8, 3, 0x224a12);
    fillRect(g, 2, 24, 5, 6, 0x4a9028);
    fillRect(g, 41, 24, 5, 6, 0x4a9028);
    // 足
    fillRect(g, 16, 48, 6, 6, 0x1a4a10);
    fillRect(g, 26, 48, 6, 6, 0x1a4a10);
  },
};

export const MORI_ONI_ART = {
  w: 48, h: 56,
  fn: (g) => {
    // 影
    drawEllipse(g, 24, 52, 30, 6, 0x221100, 0.4);
    // 体
    drawEllipse(g, 24, 36, 26, 32, 0x6a3318);
    drawEllipse(g, 24, 34, 20, 26, 0x8a4420);
    // 頭
    drawEllipse(g, 24, 16, 22, 20, 0x6a3318);
    drawEllipse(g, 24, 14, 18, 16, 0x8a4420);
    // 角（2本）
    fillTriangle(g, 16,12, 12,2, 20,12, 0xdd9900);
    fillTriangle(g, 28,12, 32,2, 36,12, 0xdd9900);
    // 目（黄金）
    drawCircle(g, 17, 16, 4, 0x111100);
    drawCircle(g, 17, 16, 3, 0xddaa00);
    drawCircle(g, 17, 16, 1, 0xffee44);
    drawCircle(g, 31, 16, 4, 0x111100);
    drawCircle(g, 31, 16, 3, 0xddaa00);
    drawCircle(g, 31, 16, 1, 0xffee44);
    // 口（牙）
    fillRect(g, 18, 22, 12, 4, 0x441a0a);
    fillRect(g, 20, 22, 3, 6, 0xffffff);
    fillRect(g, 25, 22, 3, 6, 0xffffff);
    // 腕
    drawEllipse(g, 8, 34, 10, 16, 0x6a3318);
    drawEllipse(g, 40, 34, 10, 16, 0x6a3318);
    // 爪
    for (let i=0;i<3;i++){fillRect(g,3+i*3,42,2,5,0x221100);}
    for (let i=0;i<3;i++){fillRect(g,35+i*3,42,2,5,0x221100);}
  },
};

export const PUNI_KING_ART = {
  w: 100, h: 90,
  fn: (g) => {
    // 王冠
    fillRect(g, 32, 4, 36, 12, 0xddaa00);
    fillTriangle(g, 32,4, 36,0, 40,4, 0xffcc00);
    fillTriangle(g, 44,4, 50,0, 56,4, 0xffcc00);
    fillTriangle(g, 60,4, 64,0, 68,4, 0xffcc00);
    // 宝石
    drawCircle(g, 50, 6, 3, 0xff3355);
    drawCircle(g, 36, 8, 2, 0x4455ff);
    drawCircle(g, 64, 8, 2, 0x44ff44);

    // 影（体の下）
    drawEllipse(g, 50, 82, 70, 12, 0x112244, 0.5);
    // 体メイン
    drawEllipse(g, 50, 58, 76, 62, 0x3355cc);
    drawEllipse(g, 50, 54, 66, 52, 0x4466ee);
    drawEllipse(g, 50, 48, 52, 38, 0x5577ff);
    // ハイライト（ゼリー感）
    drawEllipse(g, 38, 38, 16, 12, 0xaabbff, 0.5);
    // 目（王様の目・複眼）
    drawCircle(g, 36, 52, 8, 0x0a0a22);
    drawCircle(g, 36, 52, 6, 0xffffff);
    drawCircle(g, 36, 52, 3, 0x2244cc);
    drawCircle(g, 37, 50, 1, 0xffffff);
    drawCircle(g, 64, 52, 8, 0x0a0a22);
    drawCircle(g, 64, 52, 6, 0xffffff);
    drawCircle(g, 64, 52, 3, 0x2244cc);
    drawCircle(g, 65, 50, 1, 0xffffff);
    // 眉（怒り）
    drawLine(g, 28,44, 40,40, 0x0a0a22, 3);
    drawLine(g, 60,40, 72,44, 0x0a0a22, 3);
    // 口（偉そうなニヤリ）
    drawLine(g, 36,66, 64,66, 0x0a0a22, 3);
    drawLine(g, 36,66, 32,62, 0x0a0a22, 2);
    drawLine(g, 64,66, 68,62, 0x0a0a22, 2);
    // 牙
    fillTriangle(g, 40,66, 42,66, 41,72, 0xffffff);
    fillTriangle(g, 50,66, 52,66, 51,72, 0xffffff);
    fillTriangle(g, 58,66, 60,66, 59,72, 0xffffff);
    // オーラ
    drawEllipse(g, 50, 58, 88, 74, 0x4466ff, 0.15);
    drawEllipse(g, 50, 58, 96, 82, 0x2244cc, 0.08);
  },
};

// ─── 描画ヘルパー関数 ────────────────────────────────────────────

export function drawSprite(g, rows, palette, ox = 0, oy = 0) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const color = palette[ch];
      if (color == null) continue;
      g.fillStyle(color);
      g.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

function drawEllipse(g, cx, cy, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillEllipse(cx, cy, w, h);
}

function drawCircle(g, cx, cy, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillCircle(cx, cy, r);
}

function fillRect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function drawLine(g, x1, y1, x2, y2, color, thickness = 1) {
  g.lineStyle(thickness, color, 1);
  g.lineBetween(x1, y1, x2, y2);
}

function fillTriangle(g, x1,y1,x2,y2,x3,y3, color) {
  g.fillStyle(color);
  g.fillTriangle(x1,y1,x2,y2,x3,y3);
}
