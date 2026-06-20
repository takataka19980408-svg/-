import { GAME_W, GAME_H, COLOR } from '../config.js';

const PAD_Y = GAME_H - 80;
const PAD_X = 72;
const BTN_SIZE = 40;
const BTN_R = 22;

export default class VirtualPad {
  constructor(scene) {
    this.scene = scene;
    this.state = { up: false, down: false, left: false, right: false, a: false, b: false };
    this._build();
    this._keyboard();
  }

  _build() {
    const s = this.scene;
    const alpha = 0.65;

    // 十字キーの中心背景
    s.add.circle(PAD_X, PAD_Y, BTN_SIZE + 6, 0x111133, alpha * 0.5).setScrollFactor(0).setDepth(50);

    // UP
    this._btn('up',    PAD_X,           PAD_Y - BTN_R,  '▲');
    this._btn('down',  PAD_X,           PAD_Y + BTN_R,  '▼');
    this._btn('left',  PAD_X - BTN_R,   PAD_Y,          '◄');
    this._btn('right', PAD_X + BTN_R,   PAD_Y,          '►');

    // A / B ボタン
    const BX = GAME_W - 70;
    this._roundBtn('a', BX + 30, PAD_Y - 20, 'A', 0x224488, alpha);
    this._roundBtn('b', BX - 10, PAD_Y + 12, 'B', 0x333355, alpha);
  }

  _btn(key, x, y, label) {
    const s = this.scene;
    const bg = s.add.circle(x, y, 18, 0x223366, 0.6).setScrollFactor(0).setDepth(51).setInteractive();
    const txt = s.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '13px', color: '#99aacc',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

    bg.on('pointerdown', () => { this.state[key] = true; });
    bg.on('pointerup',   () => { this.state[key] = false; });
    bg.on('pointerout',  () => { this.state[key] = false; });
    this[`_bg_${key}`] = bg;
    this[`_txt_${key}`] = txt;
  }

  _roundBtn(key, x, y, label, color, alpha) {
    const s = this.scene;
    const bg = s.add.circle(x, y, 20, color, alpha).setScrollFactor(0).setDepth(51).setInteractive();
    const txt = s.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    bg.on('pointerdown', () => { this.state[key] = true; s.events.emit('padA'); });
    bg.on('pointerup',   () => { this.state[key] = false; });
    bg.on('pointerout',  () => { this.state[key] = false; });
  }

  _keyboard() {
    const keys = this.scene.input.keyboard;
    const map = [
      ['up',    [Phaser.Input.Keyboard.KeyCodes.UP,    Phaser.Input.Keyboard.KeyCodes.W]],
      ['down',  [Phaser.Input.Keyboard.KeyCodes.DOWN,  Phaser.Input.Keyboard.KeyCodes.S]],
      ['left',  [Phaser.Input.Keyboard.KeyCodes.LEFT,  Phaser.Input.Keyboard.KeyCodes.A]],
      ['right', [Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D]],
    ];
    this.cursors = keys.createCursorKeys();
    this.keyZ = keys.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX = keys.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyEnter = keys.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // キーボードの状態もstateに反映
    this.scene.events.on('update', () => {
      this.state.up    = this.state.up    || this.cursors.up.isDown;
      this.state.down  = this.state.down  || this.cursors.down.isDown;
      this.state.left  = this.state.left  || this.cursors.left.isDown;
      this.state.right = this.state.right || this.cursors.right.isDown;
    });
  }

  isDown(dir) { return this.state[dir]; }

  destroy() {
    // cleanup on scene shutdown
  }
}
