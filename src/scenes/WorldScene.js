import { GAME_W, GAME_H, TILE_PX, TILE, MAP_H, COLOR, PASSABLE } from '../config.js';
import VirtualPad      from '../ui/VirtualPad.js';
import EventSystem     from '../systems/EventSystem.js';
import EncounterSystem from '../systems/EncounterSystem.js';
import BGMSystem       from '../systems/BGMSystem.js';
import SaveSystem      from '../systems/SaveSystem.js';

const MOVE_DELAY = 160; // ms per tile step

export default class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  init(data) {
    this.gameState = data.gameState;
    this.flags     = data.flags;
    this.isNew     = data.isNew ?? true;
    this.chapter   = data.chapter ?? 1;
  }

  create() {
    this.inputLocked = false;
    this.moveTimer   = 0;
    this.dialogOpen  = false;

    // システム初期化
    this.bgm       = new BGMSystem(this);
    this.events_   = new EventSystem(this);
    this.encounter = new EncounterSystem();
    this.pad       = new VirtualPad(this);

    // マップロード
    this._loadMap(this.gameState.currentMap);

    // UI下部バー
    this._buildUI();

    // カメラ設定
    this.cameras.main.setViewport(0, 0, GAME_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(
      0, 0,
      this.mapData.width  * TILE_PX,
      this.mapData.height * TILE_PX
    );

    // 移動キー
    this._lastDir = null;
    this._moveCooldown = 0;

    // 入力Aボタン（決定・調べる）
    this.input.keyboard.on('keydown-Z',     () => this._interact());
    this.input.keyboard.on('keydown-ENTER', () => this._interact());
    this.events.on('padA', () => this._interact());

    // Bボタン（メニュー）
    this.input.keyboard.on('keydown-X',  () => this._openMenu());

    // DialogSceneからのコマンド受け取り
    this.events.on('dialogCmd', (cmd) => this.events_._exec(cmd));

    // フェードイン
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // 新規ゲーム開始時のイントロイベント
    if (this.isNew) {
      this.time.delayedCall(300, () => this._checkMapEvents('onEnter'));
    } else {
      this._checkMapEvents('onEnter');
    }

    // 定期セーブ（5分ごと）
    this.time.addEvent({ delay: 300000, loop: true, callback: this._autoSave, callbackScope: this });
  }

  // ─── マップ管理 ──────────────────────────────────────────────

  _loadMap(mapId) {
    // 既存マップオブジェクトを破棄
    if (this.tileGroup) this.tileGroup.clear(true, true);
    if (this.npcGroup)  this.npcGroup.clear(true, true);
    if (this.player)    this.player.destroy();

    const key = `map_${mapId}`;
    this.mapData = this.cache.json.get(key);
    if (!this.mapData) { console.error('Map not found:', mapId); return; }

    this.gameState.currentMap = mapId;
    this.bgm.play(this.mapData.bgm);

    // タイルレンダリング
    this.tileGroup = this.add.group();
    const tiles = this.mapData.tiles;
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        const t = tiles[row][col];
        const sprite = this.add.image(
          col * TILE_PX + TILE_PX / 2,
          row * TILE_PX + TILE_PX / 2,
          `tile_${t}`
        ).setDisplaySize(TILE_PX, TILE_PX);
        this.tileGroup.add(sprite);
      }
    }

    // NPC
    this.npcGroup = this.add.group();
    this.npcs = [];
    const npcDefs  = this.cache.json.get('npcs');
    (this.mapData.npcs ?? []).forEach(npcInst => {
      const def = npcDefs[npcInst.npcKey];
      if (!def) return;
      const npc = this.add.image(
        npcInst.x * TILE_PX + TILE_PX / 2,
        npcInst.y * TILE_PX + TILE_PX / 2,
        this._npcSpriteKey(npcInst.npcKey)
      ).setDisplaySize(TILE_PX, TILE_PX);
      npc._data = { ...def, ...npcInst };
      this.npcGroup.add(npc);
      this.npcs.push(npc);
    });

    // プレイヤー
    const pos = this.gameState.playerPos;
    this.player = this.add.image(
      pos.x * TILE_PX + TILE_PX / 2,
      pos.y * TILE_PX + TILE_PX / 2,
      'satoshi'
    ).setDisplaySize(TILE_PX, TILE_PX).setDepth(10);
    this.playerTile = { x: pos.x, y: pos.y };

    // マップスクリプト（onEnterはcreate後に呼ぶ）
    this._mapScripts = {
      ...(this.mapData.scripts ?? {}),
      ...(this._loadDialogueScripts()),
    };
  }

  _npcSpriteKey(npcKey) {
    const map = {
      village_elder: 'village_elder',
      mom: 'mom',
      villager_a: 'villager_a',
      villager_b: 'villager_b',
      villager_c: 'villager_c',
    };
    return map[npcKey] ?? 'village_elder';
  }

  _loadDialogueScripts() {
    // dialogue/village.json と dialogue/forest.json のキーをスクリプトとして扱える形式に変換
    const vd = this.cache.json.get('dialogue_village') ?? {};
    const fd = this.cache.json.get('dialogue_forest') ?? {};
    const result = {};
    const convert = (key, lines) => {
      result[key] = lines.map(l => ({ cmd: 'message', speaker: l.speaker, text: l.text, style: l.style }));
    };
    Object.entries(vd).forEach(([k,v]) => convert(k, v));
    Object.entries(fd).forEach(([k,v]) => convert(k, v));
    return result;
  }

  changeMap(mapId, toX, toY) {
    this.inputLocked = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.gameState.currentMap = mapId;
      this.gameState.playerPos  = { x: toX, y: toY };
      this._loadMap(mapId);
      // カメラ再設定
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.setBounds(0, 0,
        this.mapData.width  * TILE_PX,
        this.mapData.height * TILE_PX);
      this.cameras.main.fadeIn(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.inputLocked = false;
        this._checkMapEvents('onEnter');
      });
    });
  }

  // ─── プレイヤー移動 ──────────────────────────────────────────

  update(time, delta) {
    if (this.inputLocked) return;

    this._moveCooldown -= delta;
    if (this._moveCooldown > 0) return;

    let dx = 0, dy = 0;
    if      (this.pad.isDown('up'))    dy = -1;
    else if (this.pad.isDown('down'))  dy = 1;
    else if (this.pad.isDown('left'))  dx = -1;
    else if (this.pad.isDown('right')) dx = 1;

    if (dx === 0 && dy === 0) return;

    const nx = this.playerTile.x + dx;
    const ny = this.playerTile.y + dy;

    if (!this._canMove(nx, ny)) return;

    this.playerTile = { x: nx, y: ny };
    this.player.setPosition(nx * TILE_PX + TILE_PX / 2, ny * TILE_PX + TILE_PX / 2);
    this.gameState.playerPos = { x: nx, y: ny };
    this._moveCooldown = MOVE_DELAY;

    // ワープ判定
    const warp = this._checkWarp(nx, ny);
    if (warp) {
      this.changeMap(warp.to, warp.entryX, warp.entryY);
      return;
    }

    // 位置イベント判定
    this._checkMapEvents('position', nx, ny);

    // エンカウント
    if (this.mapData.encounters?.enabled) {
      const enc = this.mapData.encounters;
      if (this.encounter.step(enc.rate)) {
        const enemyId = this.encounter.pickEnemy(enc.enemies);
        this.startBattle(enemyId, false, null);
      }
    }
  }

  _canMove(nx, ny) {
    const tiles = this.mapData.tiles;
    if (ny < 0 || ny >= tiles.length) return false;
    if (nx < 0 || nx >= tiles[0].length) return false;
    const t = tiles[ny][nx];
    if (!PASSABLE[t]) return false;
    // NPC衝突
    if (this.npcs.some(n => n._data.x === nx && n._data.y === ny)) return false;
    return true;
  }

  _checkWarp(x, y) {
    return (this.mapData.warps ?? []).find(w => w.x === x && w.y === y) ?? null;
  }

  // ─── イベント判定 ─────────────────────────────────────────────

  _checkMapEvents(trigger, x, y) {
    const events = this.mapData.events ?? [];
    for (const ev of events) {
      if (ev.trigger !== trigger) continue;
      if (trigger === 'position' && (ev.x !== x || ev.y !== y)) continue;
      if (ev.once && this.flags.has(ev.id + '_done')) continue;
      if (ev.flag && this.flags.has(ev.flag)) continue;
      if (ev.requiredFlag && !this.flags.has(ev.requiredFlag)) continue;

      if (ev.once) this.flags.set(ev.id + '_done');

      const script = this._mapScripts[ev.script] ?? [];

      if (ev.id === 'mofu_event') {
        this._runScript(script, () => {
          // モフ加入
          const charData = this.cache.json.get('characters');
          this.gameState.addPartyMember(charData.mofu);
          this.flags.set('mofu_joined');
          const joinScript = this._dialogForestLines('mofu_join');
          this._runScript(joinScript, () => this._updateStatusUI());
        });
        return;
      }

      if (ev.id === 'stone_event') {
        this._runScript(script, () => {
          this.gameState.addItem('kimyou_stone');
          this.flags.set('got_stone');
        });
        return;
      }

      if (ev.id === 'boss_event') {
        this._runScript(script, () => {
          this.startBattle('puni_king', true, () => {
            const afterScript = this._dialogForestLines('puni_king_after');
            this._runScript(afterScript, () => {
              this.flags.set('boss_defeated');
              this._checkChapterEnd();
            });
          });
        });
        return;
      }

      // 通常イベント
      this._runScript(script);
    }
  }

  _dialogForestLines(key) {
    const fd = this.cache.json.get('dialogue_forest') ?? {};
    return (fd[key] ?? []).map(l => ({ cmd: 'message', speaker: l.speaker, text: l.text, style: l.style }));
  }

  _runScript(script, onDone = null) {
    if (!script || script.length === 0) { if (onDone) onDone(); return; }
    const dialog = this.scene.get('DialogScene');
    this.setInputLock(true);
    dialog.scene.setActive(true);
    dialog.startDialogue(script, () => {
      this.setInputLock(false);
      if (onDone) onDone();
    });
  }

  // ─── NPC会話 ─────────────────────────────────────────────────

  _interact() {
    if (this.inputLocked) return;

    // 前方タイルのNPCを調べる
    const px = this.playerTile.x;
    const py = this.playerTile.y;
    const adj = [[0,-1],[0,1],[-1,0],[1,0]];

    for (const [dx,dy] of adj) {
      const npc = this.npcs.find(n => n._data.x === px+dx && n._data.y === py+dy);
      if (npc) {
        this._talkToNPC(npc._data);
        return;
      }
    }

    // 正面のタイルにワープ先ラベル表示（扉など）
  }

  _talkToNPC(npcData) {
    const dialogueKey = this.flags.has('boss_defeated') && npcData.postBoss
      ? npcData.postBoss
      : npcData.dialogue;

    const vd = this.cache.json.get('dialogue_village') ?? {};
    const lines = vd[dialogueKey];
    if (!lines || lines.length === 0) return;

    const script = lines.map(l => ({ cmd: 'message', speaker: l.speaker, text: l.text }));
    this._runScript(script);
  }

  // ─── 戦闘 ────────────────────────────────────────────────────

  startBattle(enemyId, isBoss, onDone) {
    this.inputLocked = true;
    this.bgm.stop();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.pause('WorldScene');
      this.scene.launch('BattleScene', {
        enemyId,
        isBoss,
        gameState: this.gameState,
        flags: this.flags,
        onComplete: (result) => {
          this.scene.resume('WorldScene');
          this.cameras.main.fadeIn(400, 0, 0, 0);
          this.bgm.play(this.mapData.bgm);
          this.inputLocked = false;
          if (result === 'lose') {
            this._handleGameOver();
          } else {
            this._updateStatusUI();
            if (onDone) onDone();
          }
        },
      });
    });
  }

  _handleGameOver() {
    // HP1で全員復活、タイトルへ
    this.gameState.party.forEach(m => { m.hp = 1; });
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.stop('DialogScene');
      this.scene.start('TitleScene');
    });
  }

  // ─── 章終了 ──────────────────────────────────────────────────

  _checkChapterEnd() {
    if (this.flags.has('boss_defeated') && !this.flags.has('chapter1_end_done')) {
      this.flags.set('chapter1_end_done');

      // 村へ帰還演出
      this.time.delayedCall(500, () => {
        const returnScript = this._dialogForestLines('return_to_village');
        this._runScript(returnScript, () => {
          this.changeMap('midori_village', 12, 23);
          this.time.delayedCall(800, () => {
            // 村長との会話→エンド
            const ch1 = this.cache.json.get('chapter1');
            const elderScript = ch1.scripts.return_to_elder.map(c => ({...c}));
            this._runScript(elderScript, () => {
              this.flags.set('chapter1_complete');
              this._saveGame();
              this.cameras.main.fadeOut(800, 0, 0, 0);
              this.time.delayedCall(800, () => {
                this.scene.start('ChapterEndScene', {
                  chapter: 1,
                  title: '第一章　星の落ちた森',
                });
              });
            });
          });
        });
      });
    }
  }

  // ─── UI ──────────────────────────────────────────────────────

  _buildUI() {
    const g = this.add.graphics().setScrollFactor(0).setDepth(99);

    // 仕切り線
    g.lineStyle(1, 0x2a3a5a); g.lineBetween(0, MAP_H, GAME_W, MAP_H);

    // ステータスバー背景
    g.fillStyle(0x080818, 0.97);
    g.fillRect(0, MAP_H, GAME_W, 32);

    // 上端の光沢ライン
    g.lineStyle(1, 0x334477, 0.8);
    g.lineBetween(0, MAP_H, GAME_W, MAP_H);

    this._uiGraphics = g;
    this.statusTexts = {};
    this.hpBarGraphics = this.add.graphics().setScrollFactor(0).setDepth(100);
    this._updateStatusUI();
  }

  _updateStatusUI() {
    Object.values(this.statusTexts).forEach(t => t.destroy());
    this.statusTexts = {};
    this.hpBarGraphics.clear();

    const party = this.gameState.party;
    party.forEach((m, i) => {
      const bx = 10 + i * 170;
      const by = MAP_H + 6;

      // 名前
      const t = this.add.text(bx, by, m.name, {
        fontFamily: 'monospace', fontSize: '11px', color: '#88aadd',
      }).setScrollFactor(0).setDepth(101);
      this.statusTexts[m.id + '_name'] = t;

      // HP数値
      const hpTxt = this.add.text(bx + 36, by, `HP ${m.hp}/${m.maxHp}`, {
        fontFamily: 'monospace', fontSize: '10px', color: '#66cc88',
      }).setScrollFactor(0).setDepth(101);
      this.statusTexts[m.id + '_hp'] = hpTxt;

      // HPバー
      const pct = m.hp / m.maxHp;
      const barW = 100, barH = 5;
      const barX = bx, barY = by + 16;
      this.hpBarGraphics.fillStyle(0x0a1a0a);
      this.hpBarGraphics.fillRect(barX, barY, barW, barH);
      const barColor = pct > 0.5 ? 0x22cc44 : pct > 0.25 ? 0xddaa00 : 0xcc2222;
      this.hpBarGraphics.fillStyle(barColor);
      this.hpBarGraphics.fillRect(barX + 1, barY + 1, Math.floor((barW - 2) * pct), barH - 2);
      this.hpBarGraphics.lineStyle(1, 0x1a2a1a);
      this.hpBarGraphics.strokeRect(barX, barY, barW, barH);
    });

    // 地名（右端）
    const mapName = this.mapData?.name ?? '';
    if (this._mapNameText) this._mapNameText.destroy();
    this._mapNameText = this.add.text(GAME_W - 10, MAP_H + 8, mapName, {
      fontFamily: 'monospace', fontSize: '11px', color: '#445566',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
  }

  // ─── セーブ ──────────────────────────────────────────────────

  _saveGame() {
    SaveSystem.save(this.gameState.toSaveData(this.flags));
  }

  _autoSave() {
    this._saveGame();
  }

  // ─── 入力ロック ──────────────────────────────────────────────

  setInputLock(locked) {
    this.inputLocked = locked;
  }

  _openMenu() {
    // 簡易メニュー（第1章では省略。セーブのみ）
    this._saveGame();
    const dialog = this.scene.get('DialogScene');
    dialog.startDialogue([
      { cmd: 'message', speaker: null, text: 'セーブしました。' }
    ]);
  }
}
