// ゲーム全体の状態を保持する。シーン間で引き回す。
export default class GameState {
  constructor() {
    this.party = [];           // PartyMemberデータ
    this.inventory = {};       // {itemId: count}
    this.gold = 0;
    this.currentMap = 'midori_village';
    this.playerPos = { x: 8, y: 15 };
    this.chapter = 1;
    this.playTime = 0;
  }

  addPartyMember(memberData) {
    if (!this.party.find(m => m.id === memberData.id)) {
      this.party.push({ ...memberData });
    }
  }

  addItem(itemId, count = 1) {
    this.inventory[itemId] = (this.inventory[itemId] ?? 0) + count;
  }

  removeItem(itemId, count = 1) {
    if (!this.inventory[itemId]) return false;
    this.inventory[itemId] -= count;
    if (this.inventory[itemId] <= 0) delete this.inventory[itemId];
    return true;
  }

  hasItem(itemId) {
    return (this.inventory[itemId] ?? 0) > 0;
  }

  healAll() {
    this.party.forEach(m => {
      m.hp = m.maxHp;
      m.mp = m.maxMp;
    });
  }

  isAlive() {
    return this.party.some(m => m.hp > 0);
  }

  toSaveData(flags) {
    return {
      version: 1,
      timestamp: Date.now(),
      flags: flags.toJSON(),
      party: this.party.map(m => ({
        id: m.id, hp: m.hp, mp: m.mp,
        level: m.level, exp: m.exp,
        maxHp: m.maxHp, maxMp: m.maxMp,
        attack: m.attack, defense: m.defense, speed: m.speed,
        name: m.name, skills: m.skills,
      })),
      inventory: { ...this.inventory },
      gold: this.gold,
      currentMap: this.currentMap,
      playerPos: { ...this.playerPos },
      chapter: this.chapter,
    };
  }

  loadFromSave(data) {
    this.party = data.party ?? [];
    this.inventory = data.inventory ?? {};
    this.gold = data.gold ?? 0;
    this.currentMap = data.currentMap ?? 'midori_village';
    this.playerPos = data.playerPos ?? { x: 8, y: 15 };
    this.chapter = data.chapter ?? 1;
  }
}
