// PM2 Ecosystem Configuration - TacticIQ Backend
// Production-ready process management

module.exports = {
  apps: [
    {
      name: 'tacticiq-api',
      script: './server.js',
      
      instances: 'max',
      exec_mode: 'cluster',
      
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'data', 'backups'],
      max_memory_restart: '500M',
      
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      
      cron_restart: '0 3 * * *',
      
      instance_var: 'INSTANCE_ID',
    },
  ],
};
