#!/usr/bin/env node
/**
 * Web 8082: Metro 8081'de, proxy 8082'de.
 * Proxy HTML'de bundle URL'de routerRoot/hermes YOK → 500 hatası olmaz.
 * Kullanım: node scripts/start-web-8082.js  → Tarayıcıda http://localhost:8082 açın.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const METRO_PORT = 8081;
const PROXY_PORT = 8082;
const BUNDLE_PATH = '/index.bundle?platform=web&dev=true&hot=false&lazy=true';

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

function waitForPort(port, maxWait = 60000) {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function tryConnect() {
      const socket = net.createConnection(port, '127.0.0.1', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        if (Date.now() - start > maxWait) return reject(new Error('Metro port timeout'));
        setTimeout(tryConnect, 800);
      });
    }
    tryConnect();
  });
}

function startProxy() {
  return http.createServer((req, res) => {
    const url = require('url').parse(req.url);
    const pathname = url.pathname || '/';
    const targetPath = pathname + (url.search || '');

    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(indexHtml);
      return;
    }
    const proxyReq = http.request({
      hostname: 'localhost',
      port: METRO_PORT,
      path: targetPath,
      method: req.method,
      headers: req.headers,
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (e) => {
      res.writeHead(502);
      res.end('Metro baglanti hatasi: ' + e.message);
    });
    req.pipe(proxyReq);
  });
}

async function main() {
  console.log('Metro baslatiliyor (port ' + METRO_PORT + ')...');
  const expo = spawn('npx', ['expo', 'start', '--web', '--port', String(METRO_PORT)], {
    stdio: 'inherit',
    shell: true,
    cwd: root,
    env: { ...process.env, REACT_NATIVE_PACKAGER_PORT: String(METRO_PORT) },
  });

  try {
    await waitForPort(METRO_PORT);
  } catch (e) {
    console.error('Metro portu acilmadi:', e.message);
    expo.kill();
    process.exit(1);
  }

  const server = startProxy();
  server.listen(PROXY_PORT, () => {
    console.log('');
    console.log('  Tarayicida acin: http://localhost:' + PROXY_PORT);
    console.log('  (Bundle routerRoot/hermes olmadan Metro\'dan aliniyor, 500 olmaz.)');
    console.log('');
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error('Port ' + PROXY_PORT + ' dolu. Kapat: powershell -File scripts/kill-all-dev-ports.ps1');
    }
    expo.kill();
    process.exit(1);
  });

  expo.on('exit', (code) => process.exit(code != null ? code : 0));
  process.on('SIGINT', () => { expo.kill(); process.exit(0); });
  process.on('SIGTERM', () => { expo.kill(); process.exit(0); });
}

main();
