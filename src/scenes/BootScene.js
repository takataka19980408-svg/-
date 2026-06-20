// アセット読み込みシーン。全JSONデータとプレースホルダーグラフィックを生成する。
import { TILE, COLOR, TILE_COLOR } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // ローディング画面
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a18);
    const loadText = this.add.text(W / 2, H / 2 - 20, 'Loading...', {
      fontFamily: 'monospace', fontSize: '16px', color: '#4466aa',
    }).setOrigin(0.5);

    const bar = this.add.rectangle(W / 2, H / 2 + 20, 0, 6, 0x4466aa).setOrigin(0, 0.5);
    bar.x = W / 2 - 100;

    this.load.on('progress', v => {
      bar.width = 200 * v;
      loadText.setText(`Loading... ${Math.floor(v * 100)}%`);
    });

    // データJSON読み込み
    this.load.json('characters',    'data/characters.json');
    this.load.json('enemies',       'data/enemies.json');
    this.load.json('items',         'data/items.json');
    this.load.json('skills',        'data/skills.json');
    this.load.json('npcs',          'data/npcs.json');
    this.load.json('dialogue_village', 'data/dialogue/village.json');
    this.load.json('dialogue_forest',  'data/dialogue/forest.json');
    this.load.json('map_midori_village','data/maps/midori_village.json');
    this.load.json('map_satoshi_house', 'data/maps/satoshi_house.json');
    this.load.json('map_whisper_forest','data/maps/whisper_forest.json');
    this.load.json('chapter1',      'data/chapters/chapter1.json');
  }

  create() {
    // プレースホルダーテクスチャを全てプログラムで生成
    this._generateTiles();
    this._generateSprites();
    this._generateEnemySprites();
    this._generateUIAssets();

    this.scene.start('TitleScene');
  }

  _generateTiles() {
    const tileTypes = [0,1,2,3,4,5,6,7,8,9];
    const tileColors = [0x2d5a1b,0x1a3d10,0x7a6040,0xc8a87a,0xa09060,0x2255aa,0x888888,0x8b4513,0x9b7a4a,0x333333];
    const tileBorder = [0x264d18,0x0d2008,0x5a4428,0xb09868,0x887840,0x1a3d88,0x666666,0x5a2d0c,0x7a5a30,0x111111];
    const tileDetails = {
      1: (g) => { // 木：濃い緑の円
        g.fillStyle(0x0d2008); g.fillCircle(8, 5, 6);
        g.fillStyle(0x2a5510); g.fillCircle(8, 5, 5);
        g.fillStyle(0x3d7a1a); g.fillCircle(6, 4, 3);
      },
      2: (g) => { // 壁：石積みパターン
        g.fillStyle(0x8b7355);
        g.fillRect(0,0,7,7); g.fillRect(9,0,7,7);
        g.fillRect(0,9,16,7);
        g.lineStyle(1, 0x5a4428);
        g.strokeRect(0,0,7,7); g.strokeRect(9,0,7,7);
        g.strokeRect(0,9,16,7);
      },
      7: (g) => { // 扉：茶色の枠
        g.fillStyle(0xa0622a); g.fillRect(3,0,10,16);
        g.fillStyle(0xcc8844); g.fillRect(4,1,8,14);
        g.fillStyle(0xffcc66); g.fillCircle(10,8,2);
      },
      9: (g) => { // 洞穴入口
        g.fillStyle(0x1a1a2a); g.fillEllipse(8,10,12,12);
        g.fillStyle(0x333355); g.fillRect(2,10,12,6);
      },
    };

    tileTypes.forEach((t, i) => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(tileColors[i]); g.fillRect(0,0,TILE,TILE);
      if (tileDetails[t]) {
        tileDetails[t](g);
      } else {
        // グリッド線
        g.lineStyle(1, tileBorder[i], 0.5);
        g.strokeRect(0,0,TILE,TILE);
      }
      g.generateTexture(`tile_${t}`, TILE, TILE);
      g.destroy();
    });
  }

  _generateSprites() {
    // サトシ（16×16 ピクセルキャラ）
    this._genChar('satoshi', [
      // 簡易ピクセルアート: 頭(肌色)、体(青)、足
      { color: 0xf4c98a, rects: [[5,1,6,5]] },           // 頭
      { color: 0x333355, rects: [[4,6,8,5]] },            // 体
      { color: 0x222244, rects: [[4,11,3,4],[9,11,3,4]] }, // 足
      { color: 0x2244aa, rects: [[2,7,2,4],[12,7,2,4]] },  // 腕
      { color: 0x111122, rects: [[5,0,6,2]] },            // 髪
    ]);

    // モフ（犬のような丸い獣）
    this._genChar('mofu', [
      { color: 0xddbb88, rects: [[3,5,10,8]] },    // 体
      { color: 0xeecc99, rects: [[5,2,6,6]] },     // 頭
      { color: 0xddbb88, rects: [[1,9,3,4],[12,9,3,4]] }, // 足
      { color: 0x776655, rects: [[4,1,4,3],[8,1,4,3]] },   // 耳
      { color: 0x221100, rects: [[6,4,2,2],[9,4,2,2]] },   // 目
      { color: 0xff8888, rects: [[7,6,2,2]] },     // 鼻
    ]);

    // 村長
    this._genChar('village_elder', [
      { color: 0xf0e0c0, rects: [[5,1,6,5]] },
      { color: 0x886633, rects: [[4,6,8,6]] },
      { color: 0x665522, rects: [[4,12,3,3],[9,12,3,3]] },
      { color: 0xffffff, rects: [[4,0,8,3]] }, // 白髪
    ]);

    // 母
    this._genChar('mom', [
      { color: 0xf4c98a, rects: [[5,1,6,5]] },
      { color: 0xaa4466, rects: [[4,6,8,5]] },
      { color: 0x883355, rects: [[4,11,3,4],[9,11,3,4]] },
      { color: 0x552233, rects: [[4,0,8,3]] },
    ]);

    // 村人A,B,C (簡略)
    [[0x445566,'villager_a'],[0x446644,'villager_b'],[0x664444,'villager_c']].forEach(([col,key]) => {
      this._genChar(key, [
        { color: 0xf4c98a, rects: [[5,1,6,5]] },
        { color: col,      rects: [[4,6,8,5]] },
        { color: 0x222222, rects: [[4,11,3,4],[9,11,3,4]] },
        { color: 0x331100, rects: [[4,0,8,3]] },
      ]);
    });
  }

  _genChar(key, layers) {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x00000000, 0);
    g.fillRect(0,0,TILE,TILE);
    layers.forEach(layer => {
      g.fillStyle(layer.color);
      layer.rects.forEach(([x,y,w,h]) => g.fillRect(x,y,w,h));
    });
    g.generateTexture(key, TILE, TILE);
    g.destroy();
  }

  _generateEnemySprites() {
    // プニ（青いゼリー）
    this._genEnemy('puni_small', (g) => {
      g.fillStyle(0x6688ff); g.fillEllipse(32, 44, 40, 34);
      g.fillStyle(0x8899ff); g.fillEllipse(26, 38, 16, 12);
      g.fillStyle(0x111122); g.fillCircle(25, 38, 3); g.fillCircle(38, 38, 3);
    }, 64, 64);

    // クサムシャ
    this._genEnemy('kusa_musha', (g) => {
      g.fillStyle(0x336622); g.fillRect(16, 24, 32, 28);
      g.fillStyle(0x224411); g.fillRect(20, 14, 24, 18);
      g.fillStyle(0x888844); g.fillRect(24, 10, 6, 16); g.fillRect(34, 10, 6, 16);
      g.fillStyle(0x111100); g.fillCircle(26, 30, 3); g.fillCircle(38, 30, 3);
    }, 64, 64);

    // モリオニ
    this._genEnemy('mori_oni', (g) => {
      g.fillStyle(0x774422); g.fillEllipse(32, 36, 36, 40);
      g.fillStyle(0x442211); g.fillEllipse(32, 22, 28, 24);
      g.fillStyle(0xffaa00); g.fillTriangle(20,14,24,6,28,14); g.fillStyle(0xffaa00); g.fillTriangle(36,14,40,6,44,14);
      g.fillStyle(0xffffff); g.fillCircle(25, 24, 4); g.fillCircle(39, 24, 4);
      g.fillStyle(0xff2200); g.fillCircle(25, 24, 2); g.fillCircle(39, 24, 2);
    }, 64, 64);

    // プニキング（ボス）
    this._genEnemy('puni_king', (g) => {
      g.fillStyle(0x3344cc); g.fillEllipse(64, 80, 90, 76);
      g.fillStyle(0x4455dd); g.fillEllipse(50, 64, 40, 30);
      g.fillStyle(0xffdd00); g.fillTriangle(56,24, 64,10, 72,24);
      g.fillStyle(0x111133); g.fillCircle(48, 68, 7); g.fillCircle(80, 68, 7);
      g.fillStyle(0xaabbff); g.fillCircle(47, 67, 3); g.fillCircle(79, 67, 3);
      // 光るオーラ
      g.lineStyle(3, 0x6688ff, 0.5);
      g.strokeEllipse(64, 80, 100, 86);
    }, 128, 128);
  }

  _genEnemy(key, drawFn, w, h) {
    const g = this.make.graphics({ add: false });
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _generateUIAssets() {
    // メッセージウィンドウ枠パーツ
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x0a0a22, 0.95);
    g.fillRoundedRect(0, 0, 8, 8, 3);
    g.lineStyle(2, 0x4466aa);
    g.strokeRoundedRect(0, 0, 8, 8, 3);
    g.generateTexture('ui_win', 8, 8);
    g.destroy();

    // カーソル矢印
    const c = this.make.graphics({ add: false });
    c.fillStyle(0xffffff);
    c.fillTriangle(0, 0, 8, 4, 0, 8);
    c.generateTexture('ui_cursor', 8, 8);
    c.destroy();
  }
}
