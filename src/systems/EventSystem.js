// イベントスクリプトエンジン。JSON定義のcmdを順番に実行する。
export default class EventSystem {
  constructor(worldScene) {
    this.world = worldScene;
    this.running = false;
    this._queue = [];
    this._onDone = null;
  }

  run(script, onDone = null) {
    if (this.running) return;
    this.running = true;
    this._queue = [...script];
    this._onDone = onDone;
    this.world.setInputLock(true);
    this._next();
  }

  _next() {
    if (this._queue.length === 0) {
      this._finish();
      return;
    }
    const cmd = this._queue.shift();
    this._exec(cmd);
  }

  _exec(cmd) {
    const w = this.world;
    const dialog = w.scene.get('DialogScene');

    switch (cmd.cmd) {
      case 'message': {
        const lines = Array.isArray(cmd) ? cmd : [cmd];
        // 残りのmessageコマンドをまとめてdialogに渡す
        const msgLines = [cmd];
        while (this._queue.length > 0 && this._queue[0].cmd === 'message') {
          msgLines.push(this._queue.shift());
        }
        dialog.scene.setActive(true);
        dialog.startDialogue(msgLines, () => this._next());
        break;
      }

      case 'setFlag':
        w.flags.set(cmd.flag, cmd.value ?? true);
        this._next();
        break;

      case 'addItem':
        w.gameState.addItem(cmd.id);
        this._next();
        break;

      case 'addParty':
        w.gameState.addPartyMember(cmd.id);
        this._next();
        break;

      case 'battle':
        w.startBattle(cmd.enemyId, cmd.bossBgm, () => this._next());
        break;

      case 'heal':
        w.gameState.healAll();
        this._next();
        break;

      case 'fade':
        w.cameras.main.fadeOut(cmd.duration ?? 500, 0, 0, 0);
        w.time.delayedCall(cmd.duration ?? 500, () => this._next());
        break;

      case 'fadeIn':
        w.cameras.main.fadeIn(cmd.duration ?? 500, 0, 0, 0);
        this._next();
        break;

      case 'mapChange':
        w.changeMap(cmd.mapId, cmd.x, cmd.y);
        break;

      case 'chapterEnd':
        w.scene.start('ChapterEndScene', { chapter: w.chapter });
        break;

      case 'wait':
        w.time.delayedCall(cmd.duration ?? 500, () => this._next());
        break;

      case 'sfx':
        if (w.sound && w.cache.audio.has(cmd.id)) {
          w.sound.play(cmd.id);
        }
        this._next();
        break;

      default:
        console.warn('Unknown event cmd:', cmd.cmd);
        this._next();
        break;
    }
  }

  _finish() {
    this.running = false;
    this.world.setInputLock(false);
    if (this._onDone) {
      const cb = this._onDone;
      this._onDone = null;
      cb();
    }
  }
}
