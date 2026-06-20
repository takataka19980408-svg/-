import { GAME_W, GAME_H, COLOR } from '../config.js';
import SaveSystem from '../systems/SaveSystem.js';
import GameState  from '../systems/GameState.js';
import FlagSystem from '../systems/FlagSystem.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const W = GAME_W, H = GAME_H;

    // 背景グラデーション風（暗い夜空）
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000008, 0x000008, 0x000820, 0x000820, 1);
    bg.fillRect(0, 0, W, H);

    // 星を散らす
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.7;
      const r = Math.random() * 1.5 + 0.5;
      const a = Math.random() * 0.6 + 0.3;
      const star = this.add.circle(x, y, r, 0xaaccff, a);
      // まばたきアニメ
      this.tweens.add({
        targets: star, alpha: { from: a, to: a * 0.2 },
        duration: 800 + Math.random() * 2000,
        yoyo: true, repeat: -1, delay: Math.random() * 2000,
      });
    }

    // 青白い光の石（中央）
    const glowStone = this.add.graphics();
    glowStone.fillStyle(0x4488ff, 0.15);
    glowStone.fillCircle(W / 2, H * 0.38, 55);
    glowStone.fillStyle(0x6699ff, 0.2);
    glowStone.fillCircle(W / 2, H * 0.38, 38);
    glowStone.fillStyle(0x99bbff, 0.4);
    glowStone.fillCircle(W / 2, H * 0.38, 22);
    glowStone.fillStyle(0xddeeff, 0.9);
    glowStone.fillCircle(W / 2, H * 0.38, 12);

    this.tweens.add({
      targets: glowStone,
      alpha: { from: 0.7, to: 1.0 },
      duration: 2000,
      yoyo: true, repeat: -1,
    });

    // タイトルロゴ
    this.add.text(W / 2, H * 0.6, 'サトシと', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#8899bb',
      letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.67, '奇妙な石', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#aaccff',
      fontStyle: 'bold',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // ぼんやりした英語サブタイトル
    this.add.text(W / 2, H * 0.74, 'Satoshi and the Strange Stone', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#445566',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // メニュー
    const hasSave = SaveSystem.hasSave();
    const menuItems = hasSave
      ? ['つづきから', 'はじめから']
      : ['はじめから'];

    this.menuIdx = 0;
    this.menuTexts = menuItems.map((label, i) => {
      return this.add.text(W / 2, H * 0.84 + i * 34, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '16px',
        color: '#ddeeff',
      }).setOrigin(0.5);
    });
    this.menuItems = menuItems;

    this._cursor = this.add.text(W / 2 - 82, H * 0.84, '►', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5);

    this._updateCursor();

    // 入力
    const keys = this.input.keyboard;
    keys.on('keydown-UP',    () => this._move(-1));
    keys.on('keydown-DOWN',  () => this._move(1));
    keys.on('keydown-ENTER', () => this._select());
    keys.on('keydown-Z',     () => this._select());
    keys.on('keydown-SPACE', () => this._select());

    this.input.on('pointerdown', (p) => {
      this.menuTexts.forEach((t, i) => {
        if (Math.abs(p.y - t.y) < 20) {
          this.menuIdx = i;
          this._updateCursor();
          this._select();
        }
      });
    });

    // フェードイン
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // 著作権
    this.add.text(W / 2, H - 16, '© 2025  Satoshi Strange Series', {
      fontFamily: 'monospace', fontSize: '10px', color: '#334455',
    }).setOrigin(0.5);
  }

  _move(dir) {
    this.menuIdx = Phaser.Math.Clamp(this.menuIdx + dir, 0, this.menuItems.length - 1);
    this._updateCursor();
  }

  _updateCursor() {
    const t = this.menuTexts[this.menuIdx];
    this._cursor.setY(t.y);
  }

  _select() {
    const chosen = this.menuItems[this.menuIdx];
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => {
      if (chosen === 'つづきから') {
        this._loadGame();
      } else {
        this._newGame();
      }
    });
  }

  _newGame() {
    const gameState = new GameState();
    const flags     = new FlagSystem();
    const charData  = this.cache.json.get('characters');

    // サトシをパーティに追加
    gameState.addPartyMember(charData.satoshi);
    gameState.currentMap = 'midori_village';
    gameState.playerPos  = { x: 8, y: 15 };
    gameState.addItem('herb', 2);

    this.scene.start('WorldScene', { gameState, flags, isNew: true });
    this.scene.launch('DialogScene');
  }

  _loadGame() {
    const save = SaveSystem.load();
    if (!save) { this._newGame(); return; }

    const gameState = new GameState();
    const flags     = new FlagSystem();
    gameState.loadFromSave(save);
    flags.loadFrom(save.flags ?? {});

    this.scene.start('WorldScene', { gameState, flags, isNew: false });
    this.scene.launch('DialogScene');
  }
}
