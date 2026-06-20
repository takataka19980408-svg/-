import { GAME_W, GAME_H, COLOR } from '../config.js';

const STATE = { PLAYER_SELECT: 0, SKILL_SELECT: 1, ITEM_SELECT: 2, ANIM: 3, ENEMY_TURN: 4, WIN: 5, LOSE: 6 };

export default class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene'); }

  init(data) {
    this.enemyId   = data.enemyId;
    this.isBoss    = data.isBoss ?? false;
    this.gameState = data.gameState;
    this.flags     = data.flags;
    this.onComplete = data.onComplete;
  }

  create() {
    const enemyDefs = this.scene.get('BootScene')?.cache
      ? this.cache.json.get('enemies')
      : {};
    this.enemyDef = JSON.parse(JSON.stringify(this.cache.json.get('enemies')[this.enemyId]));
    this.enemy = { ...this.enemyDef };
    this.party = this.gameState.party.map(m => ({ ...m }));
    this.skills = this.cache.json.get('skills');
    this.items  = this.cache.json.get('items');
    this.state  = STATE.PLAYER_SELECT;
    this.activeIdx = 0;    // 操作中パーティメンバー
    this.menuIdx   = 0;
    this.phaseTriggered = false;

    // BGM
    const bgmKey = this.isBoss ? 'boss' : 'battle';
    // BGMSystem はWorldSceneに依存するため、ここではシンプルにsound直接
    // (音楽ファイルがあれば鳴る)

    this._build();
    this._updateUI();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ─── UI構築 ──────────────────────────────────────────────────

  _build() {
    const W = GAME_W, H = GAME_H;

    // 背景（夜の戦場風）
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0a20, 0x0a0a20, 1);
    bg.fillRect(0, 0, W, H);

    // 地面
    bg.fillStyle(0x1a1a30);
    bg.fillRect(0, H * 0.55, W, H * 0.15);
    bg.fillStyle(0x111120, 0.5);
    bg.fillRect(0, H * 0.7, W, H * 0.3);

    // ボス名表示
    if (this.isBoss) {
      this.add.text(W / 2, 12, `- BOSS -`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ff4444',
      }).setOrigin(0.5);
    }

    // 敵スプライト
    const ey = H * 0.28;
    this.enemySprite = this.add.image(W / 2, ey, this.enemyId)
      .setOrigin(0.5)
      .setDepth(5);
    if (this.isBoss) {
      this.enemySprite.setScale(1.1);
    }

    // 敵名 & HP
    this.enemyNameText = this.add.text(W / 2, H * 0.5 + 2, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ddeeff',
    }).setOrigin(0.5);

    this.enemyHpBar = this.add.graphics();

    // ステータスウィンドウ（下段）
    const SW = W - 16;
    const SY = H * 0.58;
    const SH = 72;
    this.add.rectangle(W / 2, SY + SH / 2, SW, SH, COLOR.WIN_BG, 0.95)
      .setStrokeStyle(2, COLOR.WIN_BORDER);

    this.statusTexts = [];
    this.hpBars = [];
    this.party.forEach((m, i) => {
      const x = 14 + i * 120;
      const y = SY + 6;
      this.statusTexts.push(this.add.text(x, y, '', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ddeeff',
      }));
      this.hpBars.push(this.add.graphics());
    });

    // コマンドウィンドウ
    const CW = W - 16;
    const CY = H * 0.72;
    const CH = 120;
    this.cmdBg = this.add.rectangle(W / 2, CY + CH / 2, CW, CH, COLOR.WIN_BG, 0.95)
      .setStrokeStyle(2, COLOR.WIN_BORDER);

    const cmds = ['たたかう', 'スキル', 'モンスター', 'アイテム', 'にげる'];
    this.cmdTexts = cmds.map((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      return this.add.text(30 + col * 160, CY + 10 + row * 28, c, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ddeeff',
      });
    });
    this.menuCommands = cmds;

    this.cmdCursor = this.add.text(12, CY + 10, '►', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    });

    // メッセージ欄
    this.msgText = this.add.text(W / 2, H * 0.92, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ddeeff',
      wordWrap: { width: W - 24 },
    }).setOrigin(0.5);

    // サブメニュー（スキル・アイテム選択）
    this.subMenuGroup = this.add.group();

    // 入力
    const keys = this.input.keyboard;
    keys.on('keydown-UP',    () => this._menuMove(-1));
    keys.on('keydown-DOWN',  () => this._menuMove(1));
    keys.on('keydown-LEFT',  () => this._menuMove(-2));
    keys.on('keydown-RIGHT', () => this._menuMove(2));
    keys.on('keydown-Z',     () => this._menuSelect());
    keys.on('keydown-ENTER', () => this._menuSelect());
    keys.on('keydown-X',     () => this._menuBack());

    // タッチ
    this.cmdTexts.forEach((t, i) => {
      t.setInteractive(new Phaser.Geom.Rectangle(-4, -4, 150, 28), Phaser.Geom.Rectangle.Contains);
      t.on('pointerdown', () => { this.menuIdx = i; this._updateUI(); this._menuSelect(); });
    });
  }

  // ─── UI更新 ──────────────────────────────────────────────────

  _updateUI() {
    // 敵HP
    this.enemyNameText.setText(`${this.enemy.name}  HP: ${this.enemy.hp}/${this.enemy.maxHp}`);
    const epct = this.enemy.hp / this.enemy.maxHp;
    this.enemyHpBar.clear();
    this.enemyHpBar.fillStyle(0x333355);
    this.enemyHpBar.fillRect(GAME_W / 2 - 80, GAME_H * 0.5 + 18, 160, 8);
    this.enemyHpBar.fillStyle(epct > 0.3 ? 0x2255aa : 0xaa2222);
    this.enemyHpBar.fillRect(GAME_W / 2 - 80, GAME_H * 0.5 + 18, 160 * epct, 8);

    // パーティステータス
    const SY = GAME_H * 0.58;
    this.party.forEach((m, i) => {
      const hpPct = m.hp / m.maxHp;
      const col = hpPct > 0.3 ? COLOR.HP_BAR : COLOR.HP_LOW;
      const barX = 14 + i * 120;
      const barY = SY + 34;
      this.hpBars[i].clear();
      this.hpBars[i].fillStyle(0x222233);
      this.hpBars[i].fillRect(barX, barY, 100, 6);
      this.hpBars[i].fillStyle(col);
      this.hpBars[i].fillRect(barX, barY, 100 * hpPct, 6);
      this.statusTexts[i].setText(
        `${m.name}\nHP ${m.hp}/${m.maxHp}\nMP ${m.mp}/${m.maxMp}`
      );
    });

    // コマンドカーソル
    if (this.state === STATE.PLAYER_SELECT) {
      const idx = this.menuIdx;
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const CY = GAME_H * 0.72;
      this.cmdCursor.setPosition(12 + col * 160, CY + 10 + row * 28);
    }
  }

  // ─── 入力 ────────────────────────────────────────────────────

  _menuMove(delta) {
    if (this.state !== STATE.PLAYER_SELECT) return;
    const max = this.menuCommands.length;
    this.menuIdx = (this.menuIdx + delta + max) % max;
    this._updateUI();
  }

  _menuSelect() {
    if (this.state !== STATE.PLAYER_SELECT) return;
    const cmd = this.menuCommands[this.menuIdx];

    if (cmd === 'たたかう') {
      this._playerAttack(this.party[this.activeIdx], 'normal_attack');
    } else if (cmd === 'にげる') {
      this._tryEscape();
    } else if (cmd === 'アイテム') {
      this._useItemMenu();
    } else if (cmd === 'スキル') {
      this._skillMenu();
    } else if (cmd === 'モンスター') {
      this._showMessage('今は仲間モンスターがいない。');
    }
  }

  _menuBack() {
    if (this.state === STATE.SKILL_SELECT || this.state === STATE.ITEM_SELECT) {
      this._clearSubMenu();
      this.state = STATE.PLAYER_SELECT;
    }
  }

  // ─── 戦闘行動 ─────────────────────────────────────────────────

  _playerAttack(attacker, skillId) {
    this.state = STATE.ANIM;
    const skill = this.skills[skillId];
    const dmg = Math.max(1, Math.floor(attacker.attack * skill.power) - Math.floor(this.enemy.defense / 2));
    const msg = (skill.message ?? '{user}の攻撃！').replace('{user}', attacker.name);

    this._showMessage(msg, () => {
      this._flashEnemy();
      this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
      this._showMessage(`${this.enemy.name}に ${dmg} のダメージ！`, () => {
        this._updateUI();
        this._checkBossPhase();
        if (this.enemy.hp <= 0) {
          this._enemyDie();
        } else {
          // 全員行動済み → 敵ターン
          this._enemyTurn();
        }
      });
    });
  }

  _checkBossPhase() {
    if (!this.enemy.phases || this.phaseTriggered) return;
    const pct = this.enemy.hp / this.enemy.maxHp;
    const phase = this.enemy.phases.find(p => pct <= p.hpThreshold);
    if (phase) {
      this.phaseTriggered = true;
      this.enemy.attack += phase.statBoost?.attack ?? 0;
      this._flashEnemy(0xff4444);
      this._showMessage(phase.message);
    }
  }

  _enemyTurn() {
    this.state = STATE.ENEMY_TURN;
    const target = this.party.find(m => m.hp > 0);
    if (!target) { this._lose(); return; }

    const dmg = Math.max(1, Math.floor(this.enemy.attack) - Math.floor(target.defense / 2) + Phaser.Math.Between(-2,2));
    this._showMessage(`${this.enemy.name}の攻撃！`, () => {
      target.hp = Math.max(0, target.hp - dmg);
      this._showMessage(`${target.name}に ${dmg} のダメージ！`, () => {
        this._updateUI();
        if (!this.gameState.party.some((_,i) => this.party[i].hp > 0)) {
          this._lose();
        } else {
          this.state = STATE.PLAYER_SELECT;
          this.menuIdx = 0;
          this._updateUI();
        }
      });
    });
  }

  _tryEscape() {
    const success = Math.random() > 0.35;
    if (success) {
      this._showMessage('うまく逃げ出した！', () => this._end('escape'));
    } else {
      this._showMessage('逃げられなかった！', () => this._enemyTurn());
    }
  }

  _skillMenu() {
    this.state = STATE.SKILL_SELECT;
    const attacker = this.party[this.activeIdx];
    const skillIds = attacker.skills ?? ['normal_attack'];
    this._showSubMenu(skillIds.map(id => ({
      label: this.skills[id]?.name ?? id,
      action: () => {
        const skill = this.skills[id];
        if (!skill) return;
        if (attacker.mp < skill.mpCost) {
          this._showMessage('MPが足りない！', () => { this.state = STATE.PLAYER_SELECT; });
          return;
        }
        attacker.mp -= skill.mpCost;
        this._playerAttack(attacker, id);
      },
    })));
  }

  _useItemMenu() {
    this.state = STATE.ITEM_SELECT;
    const inv = this.gameState.inventory;
    const itemIds = Object.keys(inv).filter(id => {
      const it = this.items[id];
      return it && (it.type === 'heal' || it.type === 'mp_heal');
    });

    if (itemIds.length === 0) {
      this._showMessage('アイテムがない。', () => { this.state = STATE.PLAYER_SELECT; });
      return;
    }

    this._showSubMenu(itemIds.map(id => {
      const it = this.items[id];
      return {
        label: `${it.name} ×${inv[id]}`,
        action: () => {
          const target = this.party.find(m => m.hp < m.maxHp) ?? this.party[0];
          if (it.type === 'heal') target.hp = Math.min(target.maxHp, target.hp + it.value);
          if (it.type === 'mp_heal') target.mp = Math.min(target.maxMp, target.mp + it.value);
          this.gameState.removeItem(id);
          this._showMessage(`${target.name}のHPが${it.value}回復した！`, () => {
            this._updateUI();
            this._enemyTurn();
          });
        },
      };
    }));
  }

  _showSubMenu(options) {
    this._clearSubMenu();
    const CY = GAME_H * 0.72;
    options.forEach((opt, i) => {
      const t = this.add.text(30, CY + 10 + i * 26, (i === 0 ? '► ' : '  ') + opt.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#ddeeff',
      });
      t.setInteractive(new Phaser.Geom.Rectangle(-4, -4, 260, 26), Phaser.Geom.Rectangle.Contains);
      t.on('pointerdown', () => { opt.action(); this._clearSubMenu(); });
      this.subMenuGroup.add(t);
    });

    let subIdx = 0;
    const onKey = (dir) => {
      if (this.state !== STATE.SKILL_SELECT && this.state !== STATE.ITEM_SELECT) return;
      const items = this.subMenuGroup.getChildren();
      subIdx = Phaser.Math.Clamp(subIdx + dir, 0, items.length - 1);
      items.forEach((t, i) => {
        t.setText((i === subIdx ? '► ' : '  ') + options[i].label);
      });
    };
    this._subKeyUp   = () => onKey(-1);
    this._subKeyDown = () => onKey(1);
    this._subSelect  = () => { if (this.state === STATE.SKILL_SELECT || this.state === STATE.ITEM_SELECT) { options[subIdx].action(); this._clearSubMenu(); } };
    this.input.keyboard.on('keydown-UP',    this._subKeyUp);
    this.input.keyboard.on('keydown-DOWN',  this._subKeyDown);
    this.input.keyboard.on('keydown-Z',     this._subSelect);
    this.input.keyboard.on('keydown-ENTER', this._subSelect);
  }

  _clearSubMenu() {
    this.subMenuGroup.clear(true, true);
    this.input.keyboard.off('keydown-UP',    this._subKeyUp);
    this.input.keyboard.off('keydown-DOWN',  this._subKeyDown);
    this.input.keyboard.off('keydown-Z',     this._subSelect);
    this.input.keyboard.off('keydown-ENTER', this._subSelect);
  }

  // ─── 敵死亡 ──────────────────────────────────────────────────

  _enemyDie() {
    this.state = STATE.WIN;
    this._flashEnemy(0xffffff);
    this.tweens.add({
      targets: this.enemySprite, alpha: 0, duration: 600,
    });

    const expGain  = this.enemy.exp;
    const goldGain = this.enemy.gold;
    this.gameState.gold = (this.gameState.gold ?? 0) + goldGain;

    // パーティに経験値
    this.party.forEach((m, i) => {
      if (m.hp > 0) {
        this.gameState.party[i].exp = (this.gameState.party[i].exp ?? 0) + expGain;
      }
      // 戦闘中のHP/MPをgameStateに反映
      this.gameState.party[i].hp = m.hp;
      this.gameState.party[i].mp = m.mp;
    });

    const lines = [
      `${this.enemy.name}を倒した！`,
      `経験値 ${expGain} を得た！`,
      `${goldGain}G を手に入れた！`,
    ];

    this._showSequence(lines, () => this._end('win'));
  }

  _lose() {
    this.state = STATE.LOSE;
    this.party.forEach((m, i) => {
      this.gameState.party[i].hp = 0;
    });
    this._showMessage('…サトシたちは倒れてしまった。', () => this._end('lose'));
  }

  // ─── ユーティリティ ──────────────────────────────────────────

  _showMessage(text, onDone = null) {
    this.msgText.setText(text);
    const delay = text.length * 30 + 400;
    if (onDone) this.time.delayedCall(delay, onDone);
  }

  _showSequence(lines, onDone) {
    if (lines.length === 0) { if (onDone) onDone(); return; }
    const line = lines.shift();
    this._showMessage(line, () => this._showSequence(lines, onDone));
  }

  _flashEnemy(color = 0xffffff) {
    this.enemySprite.setTintFill(color);
    this.time.delayedCall(120, () => this.enemySprite.clearTint());
  }

  _end(result) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.stop('BattleScene');
      if (this.onComplete) this.onComplete(result);
    });
  }
}
