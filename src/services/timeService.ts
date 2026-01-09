// Time Service - Oyun Zamanı Yönetimi

import { TimeSystem, TimeSpeed } from '../types/game.types';

class TimeService {
  private static instance: TimeService;
  private timeSystem: TimeSystem;
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((time: TimeSystem) => void)[] = [];

  private constructor() {
    this.timeSystem = {
      realTime: 0,
      gameTime: 0,
      speedMultiplier: 1,
      isPaused: true,
      startTime: 0,
      elapsedTime: 0,
    };
  }

  static getInstance(): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService();
    }
    return TimeService.instance;
  }

  // ======================
  // TIME CONTROL
  // ======================

  start() {
    if (this.intervalId) return;

    this.timeSystem.isPaused = false;
    this.timeSystem.startTime = Date.now();

    // Update every 100ms
    this.intervalId = setInterval(() => {
      if (!this.timeSystem.isPaused) {
        this.tick();
      }
    }, 100);

    console.log('⏱️ Time service started');
  }

  pause() {
    this.timeSystem.isPaused = true;
    console.log('⏸️ Time service paused');
  }

  resume() {
    this.timeSystem.isPaused = false;
    console.log('▶️ Time service resumed');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.timeSystem.isPaused = true;
    console.log('⏹️ Time service stopped');
  }

  reset() {
    this.stop();
    this.timeSystem = {
      realTime: 0,
      gameTime: 0,
      speedMultiplier: 1,
      isPaused: true,
      startTime: 0,
      elapsedTime: 0,
    };
    console.log('🔄 Time service reset');
  }

  // ======================
  // TIME MANIPULATION
  // ======================

  setSpeed(speed: TimeSpeed) {
    this.timeSystem.speedMultiplier = speed;
    console.log(`⚡ Speed set to ${speed}x`);
  }

  addTime(seconds: number) {
    this.timeSystem.gameTime += seconds;
  }

  setTime(seconds: number) {
    this.timeSystem.gameTime = seconds;
  }

  // ======================
  // TICK
  // ======================

  private tick() {
    const now = Date.now();
    const deltaReal = (now - (this.timeSystem.startTime + this.timeSystem.elapsedTime)) / 1000;
    
    this.timeSystem.realTime += deltaReal;
    this.timeSystem.gameTime += deltaReal * this.timeSystem.speedMultiplier;
    this.timeSystem.elapsedTime = now - this.timeSystem.startTime;

    // Notify callbacks
    this.callbacks.forEach(cb => cb(this.timeSystem));
  }

  // ======================
  // GETTERS
  // ======================

  getTime(): TimeSystem {
    return { ...this.timeSystem };
  }

  getGameTime(): number {
    return this.timeSystem.gameTime;
  }

  getRealTime(): number {
    return this.timeSystem.realTime;
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeSystem.gameTime / 60);
    const seconds = Math.floor(this.timeSystem.gameTime % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getProgress(totalDuration: number): number {
    return Math.min((this.timeSystem.gameTime / totalDuration) * 100, 100);
  }

  isPaused(): boolean {
    return this.timeSystem.isPaused;
  }

  // ======================
  // CALLBACKS
  // ======================

  subscribe(callback: (time: TimeSystem) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // ======================
  // UTILITY
  // ======================

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  formatMatchTime(seconds: number): string {
    // Convert real seconds to match minutes (90 min match in ~10 real minutes)
    // 1 real second ≈ 9 match minutes
    const matchMinutes = Math.floor((seconds / 600) * 90); // 600s = 10min
    return `${Math.min(matchMinutes, 90)}'`;
  }

  // ======================
  // PRESETS
  // ======================

  startTraining(duration: number) {
    this.reset();
    this.setSpeed(1); // Real-time
    this.start();
    console.log(`🏃 Training started: ${duration} minutes`);
  }

  startMatch() {
    this.reset();
    this.setSpeed(1); // Real-time (10 min = 90 min match)
    this.start();
    console.log('⚽ Match started');
  }

  startBootcamp() {
    this.reset();
    this.setSpeed(1);
    this.start();
    console.log('🏕️ Bootcamp started');
  }
}

export const timeService = TimeService.getInstance();
