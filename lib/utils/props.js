const fs = require('fs');
const path = require('path');
const propertiesReader = require('properties-reader');

let configPath = path.join(__dirname, '../../bin/etc/local.conf');

if (!fs.existsSync(configPath)) {
  configPath = path.join(__dirname, '../../bin/etc/local.example.conf');
}

const props = propertiesReader(configPath);

module.exports = props;
