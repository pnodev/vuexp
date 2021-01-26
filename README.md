# VuexP

VuexP stands for VuexPersistence and is a [Nuxt](https://nuxtjs.org/) module that can be used to persist your [Vuex](https://vuex.vuejs.org/) store between page reloads.

---

[![MIT license](https://img.shields.io/github/license/pnodev/vuexp.svg)](https://github.com/pnodev/vuexp/blob/master/LICENSE)
[![NPM version](https://img.shields.io/npm/v/@pnodev/vuexp/latest.svg)](https://www.npmjs.com/package/@pnodev/vuexp)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Who is this for?

While there are other packages to handle persistence of Vuex-data, this on is specifically focused on [Nuxt](https://nuxtjs.org/) and [localForage](https://github.com/localForage/localForage) as the persistence layer. localForage can easily be used to store data in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), which allows for much larger amounts of data to be stored. This module is intended to be used with localForage, but it can also be configured to work with any other persistence layer with some additional work.

## Installation

```bash
npm install --save @pnodev/vuexp # or yarn add @pnodev/vuexp
```

If you want to use VuexP with [localForage](https://github.com/localForage/localForage) (which is the recommended way), you also need to install the [localForage Nuxt-module](https://github.com/nuxt-community/localforage-module):

```bash
npm install --save @nuxtjs/localforage # or yarn add @nuxtjs/localforage
```

To activate the module, you need to add it to your module-array inside `nuxt.config.json`:

```javascript
modules: ['@pnodev/vuexp'],
```

## Configuration

In order for VuexP to work, you need to specify a storage provider:

```javascript
vuexp: {
  storage: {
    provider: '$localForage', // VuexP will expect this property to be present on the context object (like ctx.$localForage)
    name: 'vuexp', // the name you specified in your localForage config
    storeName: 'vuexp', // the storeName you specified in your localForage config
  },
},
```

If you are using localForage, you should create a dedicated database for VuexP:

```javascript
localforage: {
  instances: [
    {
      name: 'vuexp', // must match the name you used in your VuexP config
      storeName: 'vuexp', // must match the storeName you used in your VuexP config
    },
  ],
},
```

### VuexP UI

VuexP ships with an optional UI that lets you easily export complete dumps of your stored data, as well as importing dumps back into your store and clearing your store completely.

![alt "Screenshot of the VuexP UI"](/screenshot.png)

To activate the UI, you have to explicitly do so in your config. That way you can for example have it activated while in dev mode, but deactivate it in production:

```javascript
vuexp: {
  storage: {
    provider: '$localForage', // VuexP will expect this property to be present on the context object (like ctx.$localForage)
    name: 'vuexp', // the name you specified in your localForage config
    storeName: 'vuexp', // the storeName you specified in your localForage config
  },
  ui: process.env.ENV === 'dev' // or simply set true/false
},
```

### Exclude propertied from persistence

There may be properties inside your store that you don't want to have persisted, but rather have them being reset on every page load. To have VuexP ignoring them, you can define an exclude list as an array:

```javascript
vuexp: {
  // …
  nonPersistingProperties: ['auth']; // 'auth' will now be ignored by VuexP
}
```

## Example of a full config

```javascript
// nuxt.config.js

export default {
  buildModules: ['@nuxtjs/localforage'],

  localforage: {
    instances: [
      {
        name: 'vuexp',
        storeName: 'vuexp',
      },
    ],
  },

  modules: ['@pnodev/vuexp'],

  vuexp: {
    storage: {
      provider: '$localForage',
      name: 'vuexp',
      storeName: 'vuexp',
    },
    ui: true,
  },
};
```

## How does it work?

### Persisting state

Once installed, VuexP will listen to every mutation and trigger the persistence mechanism that will save the mutated data to your persistence layer, with a 500ms delay. Writing to IndexedDB can be a quite expensive process, that's why the delay is in place. If multiple mutations are processed in a short period of time, VuexP will handle all of them in on write instead of triggering multiple transactions.

### Re-Hydrating state

Once the Nuxt framework has booted up, VuexP will retrieve the saved state from your persistence layer and replace the current Vuex store with it.
There is a short time frame from hitting the page and Nuxt being all booted up in which mutations to your store could happen, before the re-hydration process kicks in. VuexP will keep track of all mutations that happen during that time and will repeat them after re-hydration is complete.

### How to know when re-hydration is complete?

There are situations when you need to know if the state has already been re-hydrated. VuexP will add a `__storeRestored` property to your state, that you can simply check for:

```javascript
if (this.$store.state.__storeRestored) {
  // do some awesome stuff
}
```

If a static check is not enough (e.g. if you have to run some code as soon as the store is ready), you can subscribe to an event on the vuexp-helper:

```javascript
this.$vuexp.on('storeRestored', (state) => {
  console.log('the store is ready now – this is the current state:', state);
});
```
