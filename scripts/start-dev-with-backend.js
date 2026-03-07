#!/usr/bin/env node
/**
 * Geliştirme: Önce backend'i port 3001'de başlatır, sağlık kontrolü yapar,
 * sonra web dev (proxy + Expo) başlatır. Tek komut: npm run dev
 *
 * Backend neden durur / bağlantı neden kopar:
 * - Backend hiç başlatılmadıysa → ERR_CONNECTION_RESET (bu script çözer)
 * - Backend terminali kapatıldıysa → process sonlanır (bu script backend'i bu process'ten spawn eder; ana terminal kapatılınca ikisi de kapanır - ayrı terminalde backend:watch kullanılabilir)
 * - Sunucu zaman aşımı → server.js içinde keepAliveTimeout/headersTimeout artırıldı
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const root = path.resolve(__dirname, '..');
const killPortScript = path.join(root, 'scripts', 'kill-port-8081.js');
const backendDir = path.join(root, 'backend');
const PORT = process.env.PORT || 3001;
const HEALTH_CHECK_RETRIES = 15;
const HEALTH_CHECK_INTERVAL = 1000;

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 3000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json && json.status === 'ok');
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function startBackend() {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npm.cmd' : 'npm';
  const child = spawn(cmd, ['run', 'dev'], {
    cwd: backendDir,
    detached: true,
    stdio: 'ignore',
    shell: isWin,
    env: { ...process.env, PORT: String(PORT) },
  });
  child.unref();
  console.log('[dev] Backend arka planda başlatıldı (port ' + PORT + ').');
}

async function waitForBackend() {
  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL));
    const ok = await checkHealth();
    if (ok) {
      console.log('[dev] Backend hazır: http://localhost:' + PORT + '/health');
      return true;
    }
  }
  console.warn('[dev] Backend ' + HEALTH_CHECK_RETRIES + ' denemede yanıt vermedi. Web yine de başlatılıyor; API istekleri başarısız olabilir.');
  return false;
}

async function main() {
  console.log('[dev] Backend + Web geliştirme ortamı başlatılıyor...\n');
  try {
    if (require('fs').existsSync(killPortScript)) {
      execSync(`node "${killPortScript}"`, { cwd: root, stdio: 'inherit' });
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (_) {}
  startBackend();
  await waitForBackend();
  console.log('[dev] Web (proxy + Expo) başlatılıyor...\n');

  const webScript = path.join(root, 'scripts', 'web-dev-no-router.js');
  const child = spawn(process.execPath, [webScript], {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code != null ? code : 0));
  process.on('SIGINT', () => { child.kill('SIGINT'); process.exit(0); });
  process.on('SIGTERM', () => { child.kill('SIGTERM'); process.exit(0); });
}

main();
