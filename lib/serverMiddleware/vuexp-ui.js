const fs = require('fs');
const { join } = require('path');

module.exports = (req, res) => {
  res.end(
    fs
      .readFileSync(join(__dirname, '..', 'ui.html'), 'utf8')
      .replace('<%= config %>', JSON.stringify(process.nuxt.$config.vuexp))
  );
};
