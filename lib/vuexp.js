export default class Vuexp {
  constructor(store) {
    this._subscribers = {};
    this.store = store;
  }

  on(action, callback) {
    if (!this._subscribers[action]) {
      this._subscribers[action] = [];
    }
    this._subscribers[action].push(callback);
  }

  trigger(action) {
    if (!this._subscribers[action]) {
      this._subscribers[action].forEach((callback) => {
        callback(this.store.state);
      });
    }
  }
}
