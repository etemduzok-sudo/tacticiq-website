#!/usr/bin/env node
/** 8081, 8083, 8084 portlarini kullanan islemi kapatir (Windows). */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

const out = run('netstat -ano');
const lines = out.split(/\r?\n/);
const pids = new Set();
const ports = ['8081', '8082', '8083', '8084', '8085', '8086', '8087', '8088', '8089'];
for (const line of lines) {
  const match = ports.some(p => line.includes(':' + p));
  if (!match) continue;
  const parts = line.trim().split(/\s+/);
  const pid = parts[parts.length - 1];
  if (pid && /^\d+$/.test(pid)) pids.add(pid);
}
if (pids.size === 0) {
  console.log('8081-8089 kullanan islem yok.');
  process.exit(0);
}
for (const pid of pids) {
  try {
    if (pid === '0') continue;
    run('taskkill /PID ' + pid + ' /F');
    console.log('PID ' + pid + ' kapatildi.');
  } catch (_) {}
}
console.log('Tamam. Simdi: npm run web:dev');
