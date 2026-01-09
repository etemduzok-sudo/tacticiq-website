// PM2 Ecosystem Configuration
// Production-ready process management

module.exports = {
  apps: [
    {
      name: 'fan-manager-api',
      script: './server.enhanced.js',
      
      // Instances
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      watch: false, // Don't watch in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '500M', // Restart if memory > 500MB
      
      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      // Process management
      cron_restart: '0 3 * * *', // Restart daily at 3 AM
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
    },
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/fan-manager-backend.git',
      path: '/var/www/fan-manager-api',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/fan-manager-backend.git',
      path: '/var/www/fan-manager-api-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};
