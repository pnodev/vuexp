const cloneDeep = require('lodash.clonedeep');

class Vuexp {
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
    if (this._subscribers[action]) {
      this._subscribers[action].forEach((callback) => {
        callback(this.store.state);
      });
    }
  }
}


export default (ctx, inject) => {
    const vuexp = new Vuexp(ctx.store);
    inject('vuexp', vuexp);
    const options = <%= JSON.stringify(options, null, 2) %>;
    const store = ctx.store;
    let timer = null;
    let changedKeys = {};
    const nonPersistingProperties = ['__storeRestored'];

    if (options.nonPersistingProperties) {
      nonPersistingProperties.push(...options.nonPersistingProperties);
    }

    const uncaughtMutations = [];
    const unsubscribe = store.subscribe((mutation) => {
      if (!store.state.__storeRestored) {
        uncaughtMutations.push({
          type: mutation.type,
          payload: cloneDeep(mutation.payload),
        });
      }
    });

    window.onNuxtReady(async () => {
      const storageProvider = options.storage.provider === '$localForage' ?  ctx[options.storage.provider][options.storage.storeName] : ctx[options.storage.provider];
      const storedStateKeys = await storageProvider.keys();
      const storedState = {};
      await Promise.all(
        storedStateKeys.map(async (key) => {
          storedState[key] = await storageProvider.getItem(key);
        })
      );

      Object.keys(store.state).forEach((key) => {
        if (!storedState[key]) {
          storedState[key] = store.state[key];
        }
      });

      storedState.__storeRestored = true;

      await store.replaceState(storedState);
      unsubscribe();
      await Promise.all(
        uncaughtMutations.map(async (mutation) => {
          await store.commit(mutation.type, mutation.payload);
        })
      );
      vuexp.trigger('storeRestored');
      startPersisting();

      async function runPersistence() {
        const data = changedKeys;
        changedKeys = {};
        await Promise.all(
          Object.keys(data).map(async (key) => {
            if (!nonPersistingProperties.includes(key)) {
              await storageProvider.setItem(key, store.state[key]);
            }
          })
        );
      }

      function startPersisting() {
        Object.keys(store.state).forEach((key) => {
          store.watch((state) => state[key], {
            handler: (oldValue, newValue) => {
              clearTimeout(timer);
              changedKeys[key] = { oldValue, newValue };
              timer = setTimeout(runPersistence, 500);
            },
            deep: true,
          });
        });
      }
    });
};
