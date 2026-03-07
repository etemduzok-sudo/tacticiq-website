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
const METRO_PORT = 8089;
const PROXY_PORTS = [8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088];
const BUNDLE_PATH = '/index.bundle?platform=web&dev=true&hot=false&lazy=true';

let expoChild = null;

const indexHtml = `<!DOCTYPE html>
<!-- TacticIQ proxy - arka plan #0F2A24. Mavi goruyorsan npm run web ile ac, baska terminalde expo acma. -->
<html lang="tr" style="background-color:#0F2A24!important">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <meta name="theme-color" content="#0F2A24">
  <title>TacticIQ</title>
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #0F2A24 !important; overflow: hidden; -webkit-overflow-scrolling: touch; outline: none !important; -webkit-tap-highlight-color: transparent; }
    html:focus, body:focus, #root:focus, *:focus { outline: none !important; }
    #root { display: flex; flex-direction: column; min-height: 100%; height: 100%; width: 100%; background: #0F2A24 !important; outline: none !important; }
  </style>
</head>
<body style="background-color:#0F2A24!important;outline:none" tabindex="-1">
  <script>(function(){var d=document;d.documentElement.style.setProperty('background-color','#0F2A24','important');d.documentElement.style.setProperty('outline','none','important');if(d.body){d.body.style.setProperty('background-color','#0F2A24','important');d.body.style.setProperty('outline','none','important');d.body.blur();}else{d.addEventListener('DOMContentLoaded',function(){d.body.style.setProperty('outline','none','important');d.body.blur();});}if(d.activeElement&&d.activeElement.blur)d.activeElement.blur();})();</script>
  <div id="root" style="background-color:#0F2A24!important;display:flex;flex-direction:column;min-height:100%;height:100%;width:100%"></div>
  <script src="${BUNDLE_PATH}"></script>
</body>
</html>`;

function startProxy() {
  return new Promise((resolve, reject) => {
    const handler = (req, res) => {
      const pathname = url.parse(req.url).pathname;
      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        });
        res.end(indexHtml);
        return;
      }
      let fullPath = (url.parse(req.url).path || '/') + (url.parse(req.url).query ? '?' + url.parse(req.url).query : '');
      try {
        const q = url.parse(req.url, true).query;
        const clean = { ...q };
        delete clean.transform_engine;
        delete clean['transform.engine'];
        delete clean.transform_routerRoot;
        delete clean['transform.routerRoot'];
        delete clean.unstable_transformProfile;
        const search = new URLSearchParams(clean).toString();
        fullPath = (url.parse(req.url).pathname || '/') + (search ? '?' + search : '');
      } catch (_) {}
      const opts = { hostname: 'localhost', port: METRO_PORT, path: fullPath, method: req.method, headers: { ...req.headers, host: 'localhost:' + METRO_PORT } };
      const proxyReq = http.request(opts, (proxyRes) => {
        if (proxyRes.statusCode === 500 && (pathname || '').includes('bundle')) {
          let body = '';
          proxyRes.on('data', (chunk) => { body += chunk; });
          proxyRes.on('end', () => {
            try {
              const err = typeof body === 'string' && body.trim() ? JSON.parse(body) : {};
              const msg = err.message || err.error || (typeof body === 'string' ? body : 'Metro 500');
              console.error('\n[METRO 500]', msg);
              if (err.stack) console.error(err.stack);
            } catch (_) {
              console.error('\n[METRO 500 body]', body ? body.substring(0, 500) : '(bos)');
            }
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(body || '{}');
          });
          return;
        }
        if ((pathname || '').includes('bundle')) {
          let buf = [];
          proxyRes.on('data', (chunk) => { buf.push(chunk); });
          proxyRes.on('end', () => {
            const body = Buffer.concat(buf);
            const first = body.slice(0, 50).toString();
            const ct = (proxyRes.headers['content-type'] || '').toLowerCase();
            if (ct.includes('text/html') || first.trimStart().startsWith('<')) {
              console.error('\n[METRO] Bundle istegi HTML dondu (status ' + proxyRes.statusCode + '). Metro JS yerine sayfa gonderiyor.');
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end('Metro HTML dondu, JS degil. Terminale bak.');
              return;
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(body);
          });
          return;
        }
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', () => { res.writeHead(502); res.end('Metro (port ' + METRO_PORT + ') baglanti hatasi.'); });
      req.pipe(proxyReq);
    };
    let listening = 0;
    PROXY_PORTS.forEach((port) => {
      const server = http.createServer(handler);
      server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') console.error('  Port ' + port + ' dolu.');
        reject(e);
      });
      server.listen(port, () => {
        listening++;
        console.log('\n  ========================================');
        console.log('  TARAYICIDA AC:  http://localhost:' + port);
        console.log('  ========================================');
        if (listening === PROXY_PORTS.length) {
          console.log('  (8081-8088 hepsi ayni sayfa; terminalde 8089 yaziyorsa onu ACMA)\n');
          resolve();
        }
      });
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
  // Cache'i her seferinde silme - Metro cok yavas kalir. Sadece sorun olursa manuel sil.
  // const expoCache = path.join(root, '.expo');
  // const metroCache = path.join(root, 'node_modules', '.cache');
  // if (fs.existsSync(expoCache)) fs.rmSync(expoCache, { recursive: true });
  // if (fs.existsSync(metroCache)) fs.rmSync(metroCache, { recursive: true });

  try {
    await startProxy();
  } catch (e) {
    process.exit(1);
  }

  console.log('Expo/Metro (port ' + METRO_PORT + ') baslatiliyor...\n');
  expoChild = spawn('npx', ['expo', 'start', '--web', '--port', String(METRO_PORT)], {
    stdio: 'inherit',
    shell: true,
    cwd: root,
    env: { ...process.env, EXPO_NO_DOTENV: '1', REACT_NATIVE_PACKAGER_PORT: String(METRO_PORT), BROWSER: 'none' },
  });

  expoChild.on('exit', (code) => process.exit(code != null ? code : 0));
  process.on('SIGINT', () => { if (expoChild) expoChild.kill('SIGINT'); process.exit(0); });
  process.on('SIGTERM', () => { if (expoChild) expoChild.kill('SIGTERM'); process.exit(0); });
}

main();
