import { TILE } from '../config.js';
import {
  PAL, drawSprite,
  SATOSHI, MOFU, ELDER, MOM, VILLAGER_A,
  TILE_GRASS, TILE_TREE, TILE_WALL_FIXED, TILE_FLOOR,
  TILE_PATH, TILE_WATER, TILE_ROCK, TILE_DOOR, TILE_DIRT, TILE_CAVE,
  PUNI_SMALL_ART, KUSA_MUSHA_ART, MORI_ONI_ART, PUNI_KING_ART,
} from '../utils/PixelArt.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ローディング画面（星空風）
    const bg = this.add.graphics();
    bg.fillStyle(0x050510);
    bg.fillRect(0, 0, W, H);

    // 星
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() < 0.2 ? 1.5 : 1;
      this.add.circle(x, y, r, 0xaaccff, Math.random() * 0.6 + 0.2);
    }

    const barBg = this.add.rectangle(W / 2, H / 2 + 20, 220, 8, 0x1a1a44);
    const bar   = this.add.rectangle(W / 2 - 110, H / 2 + 20, 0, 6, 0x4466cc).setOrigin(0, 0.5);
    const txt   = this.add.text(W / 2, H / 2 - 10, 'loading...', {
      fontFamily: 'monospace', fontSize: '12px', color: '#4466aa',
    }).setOrigin(0.5);

    this.load.on('progress', v => {
      bar.width = 220 * v;
      txt.setText(`loading... ${Math.floor(v * 100)}%`);
    });

    // データ読み込み
    this.load.json('characters',       'data/characters.json');
    this.load.json('enemies',          'data/enemies.json');
    this.load.json('items',            'data/items.json');
    this.load.json('skills',           'data/skills.json');
    this.load.json('npcs',             'data/npcs.json');
    this.load.json('dialogue_village', 'data/dialogue/village.json');
    this.load.json('dialogue_forest',  'data/dialogue/forest.json');
    this.load.json('map_midori_village','data/maps/midori_village.json');
    this.load.json('map_satoshi_house', 'data/maps/satoshi_house.json');
    this.load.json('map_whisper_forest','data/maps/whisper_forest.json');
    this.load.json('chapter1',         'data/chapters/chapter1.json');
  }

  create() {
    this._makeTiles();
    this._makeCharSprites();
    this._makeEnemySprites();
    this._makeUIAssets();
    this.scene.start('TitleScene');
  }

  // ─── タイル生成 ──────────────────────────────────────────────────

  _makeTiles() {
    const defs = [
      { key: 'tile_0', rows: TILE_GRASS      },
      { key: 'tile_1', rows: TILE_TREE       },
      { key: 'tile_2', rows: TILE_WALL_FIXED },
      { key: 'tile_3', rows: TILE_FLOOR      },
      { key: 'tile_4', rows: TILE_PATH       },
      { key: 'tile_5', rows: TILE_WATER      },
      { key: 'tile_6', rows: TILE_ROCK       },
      { key: 'tile_7', rows: TILE_DOOR       },
      { key: 'tile_8', rows: TILE_DIRT       },
      { key: 'tile_9', rows: TILE_CAVE       },
    ];
    defs.forEach(({ key, rows }) => {
      const g = this.make.graphics({ add: false });
      drawSprite(g, rows, PAL);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
    });
  }

  // ─── キャラスプライト生成 ─────────────────────────────────────────

  _makeCharSprites() {
    const chars = [
      { key: 'satoshi',      rows: SATOSHI    },
      { key: 'mofu',         rows: MOFU       },
      { key: 'village_elder',rows: ELDER      },
      { key: 'mom',          rows: MOM        },
      { key: 'villager_a',   rows: VILLAGER_A },
      { key: 'villager_b',   rows: ELDER      }, // 流用（老人2人）
      { key: 'villager_c',   rows: VILLAGER_A }, // 流用
    ];
    chars.forEach(({ key, rows }) => {
      const g = this.make.graphics({ add: false });
      drawSprite(g, rows, PAL);
      g.generateTexture(key, TILE, TILE);
      g.destroy();
    });
  }

  // ─── 敵スプライト生成 ─────────────────────────────────────────────

  _makeEnemySprites() {
    const enemies = [
      { key: 'puni_small', art: PUNI_SMALL_ART },
      { key: 'kusa_musha', art: KUSA_MUSHA_ART },
      { key: 'mori_oni',   art: MORI_ONI_ART   },
      { key: 'puni_king',  art: PUNI_KING_ART  },
    ];
    enemies.forEach(({ key, art }) => {
      const g = this.make.graphics({ add: false });
      art.fn(g);
      g.generateTexture(key, art.w, art.h);
      g.destroy();
    });
  }

  // ─── UIアセット ──────────────────────────────────────────────────

  _makeUIAssets() {
    // ウィンドウ枠 (NineSlice用 9x9)
    const g = this.make.graphics({ add: false });
    // 角
    g.fillStyle(0x0a0a22); g.fillRect(0, 0, 9, 9);
    g.lineStyle(2, 0x4466cc); g.strokeRect(0, 0, 9, 9);
    // 角の光沢
    g.fillStyle(0x6688ff, 0.3); g.fillRect(1, 1, 2, 2);
    g.generateTexture('ui_win', 9, 9);
    g.destroy();

    // 矢印カーソル
    const c = this.make.graphics({ add: false });
    c.fillStyle(0xffffff); c.fillTriangle(0,0, 8,4, 0,8);
    c.generateTexture('ui_cursor', 8, 8);
    c.destroy();

    // HPバー素材
    const hp = this.make.graphics({ add: false });
    hp.fillStyle(0x1a1a44); hp.fillRect(0,0,100,8);
    hp.fillStyle(0x22cc44); hp.fillRect(1,1,98,6);
    hp.generateTexture('hp_bar', 100, 8);
    hp.destroy();
  }
}
