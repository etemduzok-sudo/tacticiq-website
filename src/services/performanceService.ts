// Performance Monitoring Service
import { Platform } from 'react-native';

interface PerformanceTrace {
  name: string;
  startTime: number;
  metrics?: Record<string, number>;
}

class PerformanceService {
  private static instance: PerformanceService;
  private traces: Map<string, PerformanceTrace> = new Map();

  private constructor() {
    console.log('⚡ Performance Service initialized');
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Start performance trace
  startTrace(traceName: string) {
    const trace: PerformanceTrace = {
      name: traceName,
      startTime: Date.now(),
    };

    this.traces.set(traceName, trace);

    if (Platform.OS === 'web') {
      // Web Performance API
      if (window.performance && window.performance.mark) {
        window.performance.mark(`${traceName}_start`);
      }
    } else {
      // React Native Firebase Performance
      // perf().startTrace(traceName);
    }

    if (__DEV__) {
      console.log(`⚡ Trace started: ${traceName}`);
    }
  }

  // Stop performance trace
  stopTrace(traceName: string) {
    const trace = this.traces.get(traceName);
    if (!trace) {
      console.warn(`⚠️ Trace not found: ${traceName}`);
      return;
    }

    const duration = Date.now() - trace.startTime;

    if (Platform.OS === 'web') {
      // Web Performance API
      if (window.performance && window.performance.mark && window.performance.measure) {
        window.performance.mark(`${traceName}_end`);
        window.performance.measure(traceName, `${traceName}_start`, `${traceName}_end`);
      }

      // Firebase Performance (Web)
      import('../config/firebase').then(({ performance }) => {
        if (performance) {
          import('firebase/performance').then(({ trace }) => {
            const perfTrace = trace(performance, traceName);
            perfTrace.start();
            perfTrace.stop();
          });
        }
      });
    } else {
      // React Native Firebase Performance
      // perf().stopTrace(traceName);
    }

    if (__DEV__) {
      console.log(`⚡ Trace stopped: ${traceName} (${duration}ms)`);
    }

    this.traces.delete(traceName);
    return duration;
  }

  // Add metric to trace
  addMetric(traceName: string, metricName: string, value: number) {
    const trace = this.traces.get(traceName);
    if (!trace) {
      console.warn(`⚠️ Trace not found: ${traceName}`);
      return;
    }

    if (!trace.metrics) {
      trace.metrics = {};
    }

    trace.metrics[metricName] = value;

    if (__DEV__) {
      console.log(`⚡ Metric added: ${traceName}.${metricName} = ${value}`);
    }
  }

  // Measure API call performance
  async measureApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const traceName = `api_${apiName}`;
    this.startTrace(traceName);

    try {
      const result = await apiCall();
      this.stopTrace(traceName);
      return result;
    } catch (error) {
      this.stopTrace(traceName);
      throw error;
    }
  }

  // Measure component render time
  measureRender(componentName: string, callback: () => void) {
    const traceName = `render_${componentName}`;
    this.startTrace(traceName);
    
    callback();
    
    // Use RAF to measure after render
    requestAnimationFrame(() => {
      this.stopTrace(traceName);
    });
  }

  // Monitor screen load time
  monitorScreenLoad(screenName: string) {
    const traceName = `screen_${screenName}`;
    this.startTrace(traceName);

    return () => {
      this.stopTrace(traceName);
    };
  }

  // Get performance metrics
  getMetrics() {
    if (Platform.OS === 'web' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as any;
      const paint = window.performance.getEntriesByType('paint');

      return {
        loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      };
    }

    return null;
  }
}

export const performanceService = PerformanceService.getInstance();
