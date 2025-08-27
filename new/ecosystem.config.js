module.exports = {
  apps: [
    {
      name: 'whatsapp-api',
      script: 'index.js',
      node_args: '--experimental-global-webcrypto',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,
      time: true,
      kill_timeout: 10000,
      listen_timeout: 8000,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}
