class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(fn);
  }

  off(event, fn) {
    const list = this._listeners.get(event);
    if (list) {
      const idx = list.indexOf(fn);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  emit(event, data) {
    const list = this._listeners.get(event);
    if (list) list.forEach(fn => fn(data));
  }

  clear() {
    this._listeners.clear();
  }
}

module.exports = EventBus;
