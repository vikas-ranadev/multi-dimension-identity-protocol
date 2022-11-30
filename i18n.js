const path = require('path');
const { I18n } = require('i18n');
const { getProperties } = require('./properties');

const { SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('./lib/utils/constants');

const props = getProperties();

let locale = props.get('mdip.locale');

if (locale && !SUPPORTED_LOCALES.includes(locale)) {
  console.warn('[i18n] Locale not supported');
  locale = DEFAULT_LOCALE;
}

const i18n = new I18n({
  locales: SUPPORTED_LOCALES,
  defaultLocale: locale,
  directory: path.join(__dirname, 'locales'),
});

module.exports = i18n.__;
