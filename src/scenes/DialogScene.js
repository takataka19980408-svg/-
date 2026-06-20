import { GAME_W, GAME_H, COLOR } from '../config.js';

// ダイアログ表示専用のオーバーレイScene（WorldSceneの上に重なる）
export default class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogScene', active: false });
    this.queue = [];
    this.isOpen = false;
    this.onComplete = null;
    this.choices = null;
    this.choiceIdx = 0;
    this.typing = false;
    this.fullText = '';
    this.displayedText = '';
    this.typeTimer = null;
  }

  create() {
    const BOX_H = 148;
    const BOX_Y = GAME_H - 158;
    const PAD   = 14;

    // ウィンドウ背景（グラフィクスで手書き → より細かい角丸・光沢）
    this.bgGfx = this.add.graphics().setDepth(200);

    this.bg = this.add.rectangle(GAME_W / 2, BOX_Y + BOX_H / 2, GAME_W - 12, BOX_H)
      .setFillStyle(0x04041a, 0.96)
      .setVisible(false)
      .setDepth(200);

    // 外枠（グラデーション風 2層）
    this.borderOuter = this.add.rectangle(GAME_W / 2, BOX_Y + BOX_H / 2, GAME_W - 10, BOX_H + 2)
      .setStrokeStyle(2, 0x2a4a88)
      .setFillStyle(0x000000, 0)
      .setVisible(false).setDepth(200);

    this.borderInner = this.add.rectangle(GAME_W / 2, BOX_Y + BOX_H / 2, GAME_W - 14, BOX_H - 2)
      .setStrokeStyle(1, 0x4466cc, 0.5)
      .setFillStyle(0x000000, 0)
      .setVisible(false).setDepth(200);

    // 上端の光沢ライン
    this.glowLine = this.add.rectangle(GAME_W / 2, BOX_Y + 1, GAME_W - 20, 1)
      .setFillStyle(0x6688ff, 0.3).setVisible(false).setDepth(201);

    // 話者名ウィンドウ
    this.speakerBg = this.add.rectangle(PAD + 52, BOX_Y - 11, 100, 20)
      .setFillStyle(0x0a0a2a, 0.98)
      .setStrokeStyle(1, 0x3355aa)
      .setVisible(false).setDepth(200);

    this.speakerText = this.add.text(PAD + 6, BOX_Y - 21, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#88aaff',
      fontStyle: 'bold',
    }).setVisible(false).setDepth(201);

    this.bodyText = this.add.text(PAD + 6, BOX_Y + 12, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ccddf8',
      wordWrap: { width: GAME_W - 34 },
      lineSpacing: 6,
    }).setVisible(false).setDepth(201);

    // 続きカーソル（点滅三角）
    this.cursor = this.add.triangle(
      GAME_W - 22, BOX_Y + BOX_H - 18,
      0, 0, 10, 0, 5, 8,
      0xaaccff
    ).setVisible(false).setDepth(202);

    this.tweens.add({
      targets: this.cursor, alpha: { from: 1, to: 0.1 },
      duration: 600, yoyo: true, repeat: -1,
    });

    // 選択肢UI
    this.choiceTexts = [];

    // 入力（タップ or キー）
    this.input.on('pointerdown', () => this._advance());
    this.input.keyboard.on('keydown-SPACE', () => this._advance());
    this.input.keyboard.on('keydown-ENTER', () => this._advance());
    this.input.keyboard.on('keydown-Z', () => this._advance());
  }

  // 外部から会話を開始
  startDialogue(lines, onComplete = null) {
    this.queue = [...lines];
    this.onComplete = onComplete;
    this.isOpen = true;
    this.choices = null;
    this._showNext();
  }

  _showNext() {
    if (this.queue.length === 0) {
      this._close();
      return;
    }

    const line = this.queue.shift();

    // コマンド系（cmd付き）は飛ばして次へ渡す
    if (line.cmd && line.cmd !== 'message') {
      // EventSystemに処理を戻す
      this._pendingCmd = line;
      this._close();
      return;
    }

    this.bg.setVisible(true);
    this.borderOuter.setVisible(true);
    this.borderInner.setVisible(true);
    this.glowLine.setVisible(true);
    this.bodyText.setVisible(true);
    this.cursor.setVisible(false);

    const speaker = line.speaker ?? null;
    if (speaker) {
      this.speakerBg.setVisible(true);
      this.speakerText.setText(speaker).setVisible(true);
    } else {
      this.speakerBg.setVisible(false);
      this.speakerText.setVisible(false);
    }

    const isVoice = line.style === 'voice';
    if (isVoice) {
      this.bodyText.setStyle({ fontStyle: 'italic', color: '#aaddff' });
      this.borderOuter.setStrokeStyle(2, 0x3366cc);
    } else {
      this.bodyText.setStyle({ fontStyle: 'normal', color: '#ccddf8' });
      this.borderOuter.setStrokeStyle(2, 0x2a4a88);
    }

    this._typeText(line.text);
  }

  _typeText(text) {
    this.fullText = text;
    this.displayedText = '';
    this.typing = true;
    this.cursor.setVisible(false);
    this.bodyText.setText('');

    let i = 0;
    if (this.typeTimer) this.typeTimer.remove();
    this.typeTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        if (i < text.length) {
          this.displayedText += text[i++];
          this.bodyText.setText(this.displayedText);
        } else {
          this.typing = false;
          this.cursor.setVisible(true);
          this.typeTimer = null;
        }
      },
      repeat: text.length - 1,
    });
  }

  _advance() {
    if (!this.isOpen) return;

    if (this.typing) {
      // タイプ中→全文表示
      if (this.typeTimer) { this.typeTimer.remove(); this.typeTimer = null; }
      this.bodyText.setText(this.fullText);
      this.typing = false;
      this.cursor.setVisible(true);
      return;
    }

    if (this.choices) {
      // 選択肢決定
      this._confirmChoice();
      return;
    }

    this._showNext();
  }

  showChoices(options, onChoose) {
    this.choices = options;
    this.choiceIdx = 0;
    this.onChoose = onChoose;

    // 選択肢描画
    this._clearChoices();
    const startY = GAME_H - 150;
    options.forEach((opt, i) => {
      const t = this.add.text(40, startY + i * 28, (i === 0 ? '► ' : '  ') + opt.label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        color: '#ffffff',
      });
      this.choiceTexts.push(t);
    });

    // 選択肢用入力
    this.input.keyboard.on('keydown-UP', () => this._moveCursor(-1));
    this.input.keyboard.on('keydown-DOWN', () => this._moveCursor(1));
  }

  _moveCursor(dir) {
    if (!this.choices) return;
    this.choiceIdx = Phaser.Math.Clamp(this.choiceIdx + dir, 0, this.choices.length - 1);
    this.choiceTexts.forEach((t, i) => {
      t.setText((i === this.choiceIdx ? '► ' : '  ') + this.choices[i].label);
    });
  }

  _confirmChoice() {
    const chosen = this.choices[this.choiceIdx];
    this._clearChoices();
    this.choices = null;
    if (this.onChoose) this.onChoose(chosen);
  }

  _clearChoices() {
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.input.keyboard.off('keydown-UP');
    this.input.keyboard.off('keydown-DOWN');
  }

  _close() {
    this.bg.setVisible(false);
    this.borderOuter.setVisible(false);
    this.borderInner.setVisible(false);
    this.glowLine.setVisible(false);
    this.speakerBg.setVisible(false);
    this.speakerText.setVisible(false);
    this.bodyText.setVisible(false);
    this.cursor.setVisible(false);
    this.isOpen = false;

    const cb = this.onComplete;
    const cmd = this._pendingCmd;
    this.onComplete = null;
    this._pendingCmd = null;

    if (cmd) {
      // EventSystemに未処理コマンドを返す
      this.scene.get('WorldScene').events.emit('dialogCmd', cmd);
    } else if (cb) {
      cb();
    }
  }
}
