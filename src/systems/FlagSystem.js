export default class FlagSystem {
  constructor() {
    this.flags = {};
  }

  set(name, value = true) {
    this.flags[name] = value;
  }

  get(name) {
    return this.flags[name] ?? false;
  }

  has(name) {
    return !!this.flags[name];
  }

  clear(name) {
    delete this.flags[name];
  }

  loadFrom(flagData) {
    this.flags = { ...flagData };
  }

  toJSON() {
    return { ...this.flags };
  }
}
