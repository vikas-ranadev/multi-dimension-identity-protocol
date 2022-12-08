const propertiesReader = require('properties-reader');
const path = require('path');
const debug = require('debug')('mdip:properties');
const dotenv = require('dotenv');

const possibleEnvs = ['mdip', 'deps', 'btc', 'etc', 'omni', 'ipfs'];
let props;
try {
  // following should work if environment have ./bin/etc/local.conf file
  props = propertiesReader(path.join(`${__dirname}/bin/etc/local.conf`));
} catch {
  // empty .conf is used only to use env variables from eb configuration
  props = propertiesReader(path.join(`${__dirname}/local.conf`));
}

dotenv.config();
process.env.BUILD_DATE = new Date().toISOString();
debug(process.env.BUILD_DATE);

Object.entries(process.env).map(([key, value]) => {
  const moduleName = key.split('_')[0];
  const name = key.replace('_', '.');
  if (possibleEnvs.includes(moduleName)) {
    props.set(name, value);
  }
  return value;
});

debug(props.getAllProperties());
/**
 * Method to fetch properties based on local.conf file or
 * Process environment
 */
exports.getProperties = () => props;
