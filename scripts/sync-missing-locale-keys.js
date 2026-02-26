const fs = require('fs');
const path = require('path');

function allKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (obj[k] !== null && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(allKeys(obj[k], key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

function getByPath(obj, pathStr) {
  return pathStr.split('.').reduce((o, k) => (o && o[k]), obj);
}

function setByPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!current[k] || typeof current[k] !== 'object') current[k] = {};
    current = current[k];
  }
  current[parts[parts.length - 1]] = value;
}

const srcLocales = path.join(__dirname, '..', 'src', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(srcLocales, 'en.json'), 'utf8'));
const enKeys = allKeys(en);

const locales = ['tr', 'es', 'de', 'fr', 'it', 'ar', 'zh', 'ru', 'hi'];
for (const loc of locales) {
  const file = path.join(srcLocales, loc + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const locKeys = allKeys(data);
  const missing = enKeys.filter(k => !locKeys.includes(k));
  if (missing.length === 0) {
    console.log(loc + ': no missing keys');
    continue;
  }
  for (const key of missing) {
    const value = getByPath(en, key);
    if (value !== undefined) setByPath(data, key, value);
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(loc + ': added ' + missing.length + ' missing keys (from en)');
}
