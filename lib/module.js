const { resolve } = require('path');
const chalk = require('chalk');
const vuexpUi = require('./serverMiddleware/vuexp-ui');

export default function (moduleOptions) {
  const options = Object.assign({}, this.options.vuexp, moduleOptions);
  this.addPlugin({
    src: resolve(__dirname, 'plugin.js'),
    fileName: 'vuex.client.js',
    options,
  });
  if (options.ui && options.storage.provider === '$localForage') {
    process.nuxt = process.nuxt || {};
    process.nuxt.$config = process.nuxt.$config || {};
    process.nuxt.$config.vuexp = {
      ...options,
    };
    this.addServerMiddleware({ path: '/_vuexp', handler: vuexpUi });
    this.nuxt.hook('listen', (server, { url }) => {
      const uiUrl = `${url}_vuexp/`;
      this.nuxt.options.cli.badgeMessages.push(
        `VuexP UI: ${chalk.underline.yellow(uiUrl)}`
      );
    });
  }
}
module.exports.meta = require('../package.json');
