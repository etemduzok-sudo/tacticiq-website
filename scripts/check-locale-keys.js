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

const srcLocales = path.join(__dirname, '..', 'src', 'locales');
const enPath = path.join(srcLocales, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = allKeys(en).sort();

console.log('=== MOBILE (src/locales) ===');
console.log('en.json total keys:', enKeys.length);

const locales = ['tr', 'es', 'de', 'fr', 'it', 'ar', 'zh', 'ru', 'hi'];
let hasErrors = false;
for (const loc of locales) {
  const file = path.join(srcLocales, loc + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const locKeys = allKeys(data);
  const missing = enKeys.filter(k => !locKeys.includes(k));
  const extra = locKeys.filter(k => !enKeys.includes(k));
  if (missing.length) {
    hasErrors = true;
    console.log('\n' + loc + '.json MISSING ' + missing.length + ' keys:');
    console.log(missing.slice(0, 30).join('\n') + (missing.length > 30 ? '\n... and ' + (missing.length - 30) + ' more' : ''));
  }
  if (extra.length) {
    console.log(loc + ' EXTRA keys (not in en):', extra.length);
  }
  if (!missing.length && !extra.length) console.log(loc + ': OK');
}

// Website locales: extract keys from .ts (flat key: value)
const webTranslations = path.join(__dirname, '..', 'website', 'src', 'translations');
if (fs.existsSync(webTranslations)) {
  console.log('\n=== WEB (website/src/translations) ===');
  const extractKeys = (content) => {
    const keys = [];
    const re = /^\s*['"]([^'"]+)['"]\s*:/gm;
    let m;
    while ((m = re.exec(content)) !== null) keys.push(m[1]);
    return keys;
  };
  const enPath = path.join(webTranslations, 'en.ts');
  const enContent = fs.readFileSync(enPath, 'utf8');
  const webEnKeys = [...new Set(extractKeys(enContent))].sort();
  console.log('en.ts total keys:', webEnKeys.length);
  for (const loc of locales) {
    const file = path.join(webTranslations, loc + '.ts');
    if (!fs.existsSync(file)) { console.log(loc + ': FILE MISSING'); hasErrors = true; continue; }
    const locKeys = extractKeys(fs.readFileSync(file, 'utf8'));
    const missing = webEnKeys.filter(k => !locKeys.includes(k));
    if (missing.length) {
      hasErrors = true;
      console.log(loc + ' MISSING ' + missing.length + ':', missing.slice(0, 15).join(', ') + (missing.length > 15 ? '...' : ''));
    } else console.log(loc + ': OK');
  }
}

process.exit(hasErrors ? 1 : 0);
