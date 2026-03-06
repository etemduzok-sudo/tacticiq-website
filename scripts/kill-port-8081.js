#!/usr/bin/env node
/** 8081 ve 8083 portlarini kullanan islemi kapatir (Windows). */
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
for (const line of lines) {
  if (!line.includes(':8081') && !line.includes(':8083')) continue;
  const parts = line.trim().split(/\s+/);
  const pid = parts[parts.length - 1];
  if (pid && /^\d+$/.test(pid)) pids.add(pid);
}
if (pids.size === 0) {
  console.log('8081/8083 kullanan islem yok.');
  process.exit(0);
}
for (const pid of pids) {
  try {
    run('taskkill /PID ' + pid + ' /F');
    console.log('PID ' + pid + ' kapatildi.');
  } catch (_) {}
}
console.log('Tamam. Simdi: npm run web:dev');
