export default class EncounterSystem {
  constructor() {
    this.steps = 0;
    this.nextThreshold = this._roll();
  }

  step(rate) {
    this.steps++;
    if (this.steps >= this.nextThreshold) {
      this.steps = 0;
      this.nextThreshold = this._roll(rate);
      return true;
    }
    return false;
  }

  _roll(rate = 10) {
    // rate=10 → avg 10歩に1回エンカウント
    return Math.floor(Math.random() * rate * 1.5) + Math.ceil(rate * 0.5);
  }

  pickEnemy(enemyList) {
    // enemyList: [{id, weight}, ...]
    const total = enemyList.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of enemyList) {
      r -= e.weight;
      if (r <= 0) return e.id;
    }
    return enemyList[0].id;
  }
}
