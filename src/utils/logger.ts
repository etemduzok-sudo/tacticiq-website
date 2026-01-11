// Logger Utility - Production-safe logging
// Only logs in development mode

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },

  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug(...args);
    }
  },
};

// Performance monitoring
export const perfLogger = {
  start: (label: string) => {
    if (IS_DEV) {
      console.time(label);
    }
  },

  end: (label: string) => {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  },
};
