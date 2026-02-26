#!/usr/bin/env node
/**
 * Backend Watcher - Backend durduğunda acilen yeniden başlatır.
 * API ve DB verisi hata kabul etmez; backend kesintisiz çalışmalıdır.
 *
 * Kullanım: node scripts/backend-watcher.js
 * veya: npm run backend:watch
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = process.env.BACKEND_PORT || process.env.API_PORT || 3001;
const CHECK_INTERVAL_MS = 5000;
const RESTART_COOLDOWN_MS = 8000;

let backendProcess = null;
let lastRestartTime = 0;

function getBackendDir() {
  return path.resolve(__dirname, '..', 'backend');
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 4000,
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
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function startBackend() {
  const backendDir = getBackendDir();
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npm.cmd' : 'npm';
  const args = ['run', 'start'];

  console.log(`[Watcher] Backend başlatılıyor: ${backendDir}`);
  backendProcess = spawn(cmd, args, {
    cwd: backendDir,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, PORT: String(PORT) },
  });

  backendProcess.on('exit', (code, signal) => {
    backendProcess = null;
    console.log(`[Watcher] Backend çıktı (code=${code}, signal=${signal})`);
  });

  backendProcess.on('error', (err) => {
    console.error('[Watcher] Backend process error:', err.message);
    backendProcess = null;
  });
}

async function loop() {
  const ok = await checkHealth();
  if (ok) {
    return;
  }
  const now = Date.now();
  if (now - lastRestartTime < RESTART_COOLDOWN_MS) {
    return;
  }
  lastRestartTime = now;
  if (backendProcess) {
    try {
      backendProcess.kill('SIGTERM');
    } catch (_) {}
    backendProcess = null;
  }
  console.log('[Watcher] Backend yanıt vermiyor, acilen yeniden başlatılıyor...');
  startBackend();
}

function main() {
  console.log(`[Watcher] Backend izleniyor (http://localhost:${PORT}/health), aralık: ${CHECK_INTERVAL_MS / 1000}s`);
  startBackend();
  setInterval(loop, CHECK_INTERVAL_MS);
}

main();
