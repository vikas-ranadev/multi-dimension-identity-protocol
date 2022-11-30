const propertiesReader = require('properties-reader');
const path = require('path');
const debug = require('debug')('mdip:properties');
const dotenv = require('dotenv');

dotenv.config();
const props = propertiesReader(path.join(`${__dirname}/bin/etc/local.conf`));

process.env.BUILD_DATE = new Date().toISOString();
debug(process.env.BUILD_DATE);

Object.entries(process.env).map(([key, value]) => {
  if (key.split('.').length > 1) {
    props.set(key, value);
  }
  return value;
});

debug(props.getAllProperties());
/**
 * Method to fetch properties based on local.conf file or
 * Process environment
 */
exports.getProperties = () => props;
