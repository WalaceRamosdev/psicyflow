const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude portal-paciente subfolder from Metro bundling to avoid node_modules conflicts
config.resolver.blockList = [
  /portal-paciente\/.*/
];

module.exports = config;
