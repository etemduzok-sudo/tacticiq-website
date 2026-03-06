#!/usr/bin/env node
/**
 * Web'i 500 / MIME type hatasını önleyerek başlatır.
 * app/ → app.disabled yapar, app.json'da router.root'u ./app.disabled yapar,
 * Expo'yu çalıştırır; çıkışta hepsini geri yükler.
 * Kullanım: node scripts/run-web-no-router.js  veya  npm run web:dev
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');
const appDisabledDir = path.join(root, 'app.disabled');
const appJsonPath = path.join(root, 'app.json');

let savedAppJsonRouter = null;

function patchAppJson(useDisabled) {
  const data = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (!data.expo.extra) data.expo.extra = {};
  if (!data.expo.extra.router) data.expo.extra.router = { origin: false, root: './app' };
  if (useDisabled) {
    savedAppJsonRouter = data.expo.extra.router.root;
    data.expo.extra.router.root = './app.disabled';
    fs.writeFileSync(appJsonPath, JSON.stringify(data, null, 2));
  } else if (savedAppJsonRouter !== null) {
    data.expo.extra.router.root = savedAppJsonRouter;
    fs.writeFileSync(appJsonPath, JSON.stringify(data, null, 2));
    savedAppJsonRouter = null;
  }
}

function restoreApp() {
  if (fs.existsSync(appDisabledDir)) {
    try {
      fs.renameSync(appDisabledDir, appDir);
      console.log('\n\u2713 app/ geri yüklendi.');
    } catch (e) {
      console.warn('\n\u26a0 app.disabled -> app geri alınamadı:', e.message);
    }
  }
  try {
    patchAppJson(false);
    console.log('\u2713 app.json router root geri yüklendi.');
  } catch (e) {
    console.warn('\u26a0 app.json geri alınamadı:', e.message);
  }
}

function main() {
  const hadApp = fs.existsSync(appDir);
  if (hadApp) {
    try {
      fs.renameSync(appDir, appDisabledDir);
      console.log('app/ -> app.disabled (Expo Router web için devre dışı).');
    } catch (e) {
      console.error('app/ devre dışı bırakılamadı:', e.message);
      process.exit(1);
    }
  }
  try {
    patchAppJson(true);
    console.log('app.json router.root -> ./app.disabled.');
  } catch (e) {
    console.error('app.json güncellenemedi:', e.message);
    restoreApp();
    process.exit(1);
  }

  const expoCache = path.join(root, '.expo');
  const metroCache = path.join(root, 'node_modules', '.cache');
  if (fs.existsSync(expoCache)) fs.rmSync(expoCache, { recursive: true });
  if (fs.existsSync(metroCache)) fs.rmSync(metroCache, { recursive: true });
  console.log('Cache temizlendi. Expo başlatılıyor...\n');

  const child = spawn(
    'npx',
    ['expo', 'start', '--web', '--clear'],
    { stdio: 'inherit', shell: true, cwd: root }
  );

  child.on('exit', (code) => {
    restoreApp();
    process.exit(code !== null ? code : 0);
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main();
