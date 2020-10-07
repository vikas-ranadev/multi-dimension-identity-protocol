const path = require('path');
const { I18n } = require('i18n');

const i18n = new I18n({
  locales: ['en'],
  directory: path.join(__dirname, 'locales'),
});

/** TODO: Find a better work-around to prevent dangling under-score. */
// eslint-disable-next-line no-underscore-dangle
module.exports = i18n.__;
