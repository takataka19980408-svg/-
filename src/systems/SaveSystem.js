const SAVE_KEY = 'satoshi_stone_save';

export default class SaveSystem {
  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  }

  static hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  static deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  static buildSaveData(gameState) {
    return {
      version: 1,
      timestamp: Date.now(),
      flags: gameState.flags,
      party: gameState.party.map(m => ({
        id: m.id,
        hp: m.hp,
        mp: m.mp,
        level: m.level,
        exp: m.exp,
      })),
      currentMap: gameState.currentMap,
      playerPos: gameState.playerPos,
      chapter: gameState.chapter,
    };
  }
}
