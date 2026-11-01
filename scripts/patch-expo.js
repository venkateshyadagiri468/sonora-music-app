const fs = require('fs');
const path = require('path');

// 1. Ensure polyfill.js files exist
const p1 = path.join(__dirname, '../node_modules/expo-modules-core/build-cjs/polyfill.js');
if (fs.existsSync(path.dirname(p1)) && !fs.existsSync(p1)) {
  fs.writeFileSync(p1, 'module.exports = require("./polyfill/index.js");\n');
}

const p2 = path.join(__dirname, '../node_modules/expo-modules-core/build/polyfill.js');
if (fs.existsSync(path.dirname(p2)) && !fs.existsSync(p2)) {
  fs.writeFileSync(p2, 'export * from "./polyfill/index.js";\n');
}

// 2. Fix Platform, uuid, and NativeModulesProxy default exports in build-cjs/index.js
const cjsIndex = path.join(__dirname, '../node_modules/expo-modules-core/build-cjs/index.js');
if (fs.existsSync(cjsIndex)) {
  let content = fs.readFileSync(cjsIndex, 'utf8');
  content = content.replace(/exports\.Platform = _Platform;(?!\.default)/, 'exports.Platform = _Platform.default || _Platform;');
  content = content.replace(/exports\.uuid = _uuid;(?!\.default)/, 'exports.uuid = _uuid.default || _uuid;');
  content = content.replace(/exports\.NativeModulesProxy = _NativeModulesProxy;(?!\.default)/, 'exports.NativeModulesProxy = _NativeModulesProxy.default || _NativeModulesProxy;');
  content = content.replace('require("./NativeViewManagerAdapter.js")', 'require("./NativeViewManagerAdapter")');
  content = content.replace('require("./NativeModulesProxy.js")', 'require("./NativeModulesProxy")');
  fs.writeFileSync(cjsIndex, content);
}
