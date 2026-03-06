#!/usr/bin/env node
/**
 * Web dev: Proxy 8081'de once baslar, Expo 8083'te. 8081 acilinca routerRoot olmayan HTML gelir, 500 olmaz.
 * MUTLAKA: npm run web:dev calistir, SONRA tarayicida SADECE http://localhost:8081 ac.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');
const backupDir = path.join(root, '_app_router_backup');
const METRO_PORT = 8083;
const PROXY_PORT = 8081;
const BUNDLE_PATH = '/index.bundle?platform=web&dev=true&hot=false&lazy=true';

let expoChild = null;

const indexHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>TacticIQ</title>
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #0F172A; overflow: hidden; -webkit-overflow-scrolling: touch; }
    #root { display: flex; flex-direction: column; min-height: 100%; height: 100%; width: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="http://localhost:${METRO_PORT}${BUNDLE_PATH}"></script>
</body>
</html>`;

function startProxy() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const pathname = url.parse(req.url).pathname;
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexHtml);
        return;
      }
      const fullPath = (url.parse(req.url).path || '/') + (url.parse(req.url).query ? '?' + url.parse(req.url).query : '');
      const opts = { hostname: 'localhost', port: METRO_PORT, path: fullPath, method: req.method, headers: req.headers };
      const proxyReq = http.request(opts, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', () => { res.writeHead(502); res.end('Metro (port ' + METRO_PORT + ') baglanti hatasi.'); });
      req.pipe(proxyReq);
    });
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error('\n  HATA: Port ' + PROXY_PORT + ' zaten kullaniliyor.');
        console.error('  Cozum: npm run web:kill  calistir, sonra tekrar  npm run web:dev\n');
        reject(e);
      } else reject(e);
    });
    server.listen(PROXY_PORT, () => {
      console.log('\n  ========================================');
      console.log('  TARAYICIDA SADECE BUNU AC:');
      console.log('  http://localhost:' + PROXY_PORT);
      console.log('  ========================================');
      console.log('  (8083 veya baska port ACMA - 500 alirsin)\n');
      resolve();
    });
  });
}

async function main() {
  if (fs.existsSync(appDir)) {
    try {
      if (fs.existsSync(backupDir)) fs.rmSync(backupDir, { recursive: true });
      fs.renameSync(appDir, backupDir);
      console.log('app/ -> _app_router_backup');
    } catch (e) {
      console.error('app/ tasinamadi:', e.message);
      process.exit(1);
    }
  }
  const expoCache = path.join(root, '.expo');
  const metroCache = path.join(root, 'node_modules', '.cache');
  if (fs.existsSync(expoCache)) fs.rmSync(expoCache, { recursive: true });
  if (fs.existsSync(metroCache)) fs.rmSync(metroCache, { recursive: true });

  try {
    await startProxy();
  } catch (e) {
    process.exit(1);
  }

  console.log('Expo (port ' + METRO_PORT + ') baslatiliyor...\n');
  expoChild = spawn('npx', ['expo', 'start', '--web', '--clear', '--port', String(METRO_PORT)], {
    stdio: 'inherit',
    shell: true,
    cwd: root,
    env: { ...process.env, EXPO_NO_DOTENV: '1', REACT_NATIVE_PACKAGER_PORT: String(METRO_PORT) },
  });

  expoChild.on('exit', (code) => process.exit(code != null ? code : 0));
  process.on('SIGINT', () => { if (expoChild) expoChild.kill('SIGINT'); process.exit(0); });
  process.on('SIGTERM', () => { if (expoChild) expoChild.kill('SIGTERM'); process.exit(0); });
}

main();
