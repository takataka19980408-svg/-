import { GAME_W, GAME_H, COLOR } from '../config.js';

export default class ChapterEndScene extends Phaser.Scene {
  constructor() { super('ChapterEndScene'); }

  init(data) {
    this.chapter = data.chapter ?? 1;
    this.title   = data.title ?? '第一章　星の落ちた森';
  }

  create() {
    const W = GAME_W, H = GAME_H;

    // 暗い背景
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

    // 星
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.6;
      const r = Math.random() * 1.2 + 0.3;
      const star = this.add.circle(x, y, r, 0xaaccff, 0);
      this.tweens.add({
        targets: star, alpha: Math.random() * 0.7 + 0.1,
        delay: Math.random() * 1500,
        duration: 1200, ease: 'Sine.easeInOut',
      });
    }

    // 章タイトル
    const chapterLabel = this.add.text(W / 2, H * 0.4, `第${this.chapter}章 　完`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#4466aa',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    const chapterTitle = this.add.text(W / 2, H * 0.5, this.title, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#aaccff',
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);

    // 次回予告
    const nextHint = this.add.text(W / 2, H * 0.65, '次章へ続く...', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#334455',
    }).setOrigin(0.5).setAlpha(0);

    const lore = this.add.text(W / 2, H * 0.78, [
      '「その石の声は、何千年も',
      '　誰にも届かなかった……」',
    ].join('\n'), {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#445566',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // フェードイン演出シーケンス
    this.tweens.add({
      targets: chapterLabel, alpha: 1,
      delay: 1000, duration: 1500,
    });
    this.tweens.add({
      targets: chapterTitle, alpha: 1,
      delay: 2200, duration: 1500,
    });
    this.tweens.add({
      targets: nextHint, alpha: 1,
      delay: 3800, duration: 1200,
    });
    this.tweens.add({
      targets: lore, alpha: 1,
      delay: 5000, duration: 1500,
    });

    // タップかキー入力でタイトルへ
    this.input.once('pointerdown', () => this._toTitle());
    this.input.keyboard.once('keydown', () => this._toTitle());

    // 9秒後に自動でタイトルへ
    this.time.delayedCall(9000, () => this._toTitle());
  }

  _toTitle() {
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.time.delayedCall(1200, () => {
      this.scene.stop('DialogScene');
      this.scene.stop('WorldScene');
      this.scene.start('TitleScene');
    });
  }
}
