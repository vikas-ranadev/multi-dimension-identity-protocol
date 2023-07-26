require('dotenv').config();
const propertiesReader = require('properties-reader');
const path = require('path');
const debug = require('debug')('mdip:properties');

const possibleEnvs = [
  'mdip',
  'deps',
  'btc',
  'etc',
  'omni',
  'ipfs',
  'p2p_transport',
];
let props;
try {
  // following should work if environment have ./bin/etc/local.conf file
  props = propertiesReader(path.join(`${__dirname}/bin/etc/local.conf`));
} catch {
  // empty .conf is used only to use env variables from eb configuration
  props = propertiesReader(path.join(`${__dirname}/local.conf`));
}

process.env.BUILD_DATE = new Date().toISOString();
debug(process.env.BUILD_DATE);
const getModuleKeyName = (key) => {
  const keyArr = key.split('_');
  const moduleName = keyArr.length === 3 ? `${keyArr[0]}_${keyArr[1]}` : keyArr[0];
  const name = keyArr.length === 3
    ? `${keyArr[0]}_${keyArr[1]}.${keyArr[2]}`
    : key.replace('_', '.');
  return {
    name,
    moduleName,
  };
};

Object.entries(process.env).forEach(([key, value]) => {
  const { name, moduleName } = getModuleKeyName(key);
  if (possibleEnvs.includes(moduleName)) {
    props.set(name, value);
  }
});

debug(props.getAllProperties());
/**
 * Method to fetch properties based on local.conf file or
 * Process environment
 */
exports.getProperties = () => props;
