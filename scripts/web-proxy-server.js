#!/usr/bin/env node
/**
 * Web proxy: localhost:8082'de kendi HTML'imizi sunar.
 * Bundle isteği routerRoot OLMADAN Metro'ya (8081) gider, 500 hatası önlenir.
 * Kullanım: Expo 8081'de çalışırken bu script 8082'de çalışır; tarayıcıda http://localhost:8082 açın.
 */
const http = require('http');
const url = require('url');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;

// routerRoot ve hermes OLMADAN bundle URL (500'e neden olan parametreler çıkarıldı)
const BUNDLE_PATH = '/index.bundle?platform=web&dev=true&hot=false&lazy=true';

const indexHtml = `<!DOCTYPE html>
<html lang="tr" style="background-color:#0F2A24">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>TacticIQ</title>
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #0F2A24; overflow: hidden; -webkit-overflow-scrolling: touch; }
    #root { display: flex; flex-direction: column; min-height: 100%; height: 100%; width: 100%; background: #0F2A24; }
  </style>
</head>
<body style="background-color:#0F2A24">
  <div id="root" style="background-color:#0F2A24;display:flex;flex-direction:column;min-height:100%;height:100%;width:100%"></div>
  <script src="http://localhost:${METRO_PORT}${BUNDLE_PATH}"></script>
</body>
</html>`;

function proxy(req, res, targetPath) {
  const opts = {
    hostname: 'localhost',
    port: METRO_PORT,
    path: targetPath,
    method: req.method,
    headers: req.headers,
  };
  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Metro\'ya baglanilamadi (8081 calisiyor mu?): ' + e.message);
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;
  const fullPath = url.parse(req.url).path || '/';
  const query = url.parse(req.url).query || '';
  const targetPath = fullPath + (query ? '?' + query : '');

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml);
    return;
  }
  proxy(req, res, targetPath);
});

server.listen(PROXY_PORT, () => {
  console.log('');
  console.log('  Web proxy: http://localhost:' + PROXY_PORT);
  console.log('  Bundle routerRoot olmadan Metro\'ya (8081) gidiyor.');
  console.log('  Tarayicida http://localhost:' + PROXY_PORT + ' acin.');
  console.log('');
});
