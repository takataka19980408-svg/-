// BGM管理システム。現状は無音だが、後から音楽ファイルを追加して差し替え可能な構造。
const BGM_CONFIG = {
  title:          { key: 'bgm_title',   loop: true },
  midori_village: { key: 'bgm_village', loop: true },
  whisper_forest: { key: 'bgm_forest',  loop: true },
  battle:         { key: 'bgm_battle',  loop: true },
  boss:           { key: 'bgm_boss',    loop: true },
  chapter_end:    { key: 'bgm_end',     loop: false },
};

export default class BGMSystem {
  constructor(scene) {
    this.scene = scene;
    this.current = null;
    this.currentKey = null;
    this.muted = false;
  }

  play(id) {
    const conf = BGM_CONFIG[id];
    if (!conf) return;
    if (this.currentKey === id) return;

    this.stop();
    this.currentKey = id;

    // 音楽ファイルがロードされていれば再生、なければスキップ（無音で動作）
    if (this.scene.cache.audio.has(conf.key)) {
      this.current = this.scene.sound.add(conf.key, { loop: conf.loop, volume: 0.6 });
      if (!this.muted) this.current.play();
    }
  }

  stop() {
    if (this.current) {
      this.current.stop();
      this.current.destroy();
      this.current = null;
    }
    this.currentKey = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.current) {
      if (this.muted) this.current.pause();
      else this.current.resume();
    }
    return this.muted;
  }
}
