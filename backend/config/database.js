// Database Configuration - Connection Pooling Optimization
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Optimized Supabase client configuration
const supabaseConfig = {
  auth: {
    persistSession: false, // Server-side doesn't need session persistence
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'fan-manager-backend',
    },
  },
  // Connection pooling settings
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events per second
    },
  },
};

// Create Supabase client with optimized settings
const supabase = createClient(supabaseUrl, supabaseKey, supabaseConfig);

// Connection pool manager
class ConnectionPool {
  constructor() {
    this.activeConnections = 0;
    this.maxConnections = 20; // Max concurrent connections
    this.waitQueue = [];
  }

  async acquire() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return Promise.resolve();
    }

    // Wait in queue
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release() {
    this.activeConnections--;
    
    // Process queue
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.activeConnections++;
      resolve();
    }
  }

  getStats() {
    return {
      active: this.activeConnections,
      waiting: this.waitQueue.length,
      max: this.maxConnections,
    };
  }
}

const connectionPool = new ConnectionPool();

// Wrapped query function with connection pooling
async function query(queryFn) {
  await connectionPool.acquire();
  
  try {
    const result = await queryFn(supabase);
    return result;
  } finally {
    connectionPool.release();
  }
}

// Health check
async function healthCheck() {
  try {
    const { data, error } = await supabase
      .from('_health')
      .select('*')
      .limit(1);
    
    return { healthy: !error, error: error?.message };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

module.exports = {
  supabase,
  query,
  connectionPool,
  healthCheck,
};
