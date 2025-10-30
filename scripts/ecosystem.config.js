module.exports = {
  apps: [
    {
      name: 'sistema-it-backend',
      script: './backend/dist/main.js',
      cwd: './',

      // Instancias y escalado
      instances: 1,
      exec_mode: 'fork', // 'cluster' para múltiples instancias

      // Reinicio automático
      autorestart: true,
      watch: false, // No watch en producción para mejor performance
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Gestión de memoria
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,

      // Timeouts
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Variables de entorno - PRODUCCIÓN
      env_production: {
        NODE_ENV: 'production',
        PORT: 3011,
      },

      // Variables de entorno - DESARROLLO
      env_development: {
        NODE_ENV: 'development',
        PORT: 3011,
      },

      // Logs
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,

      // Configuración para Windows
      windowsHide: true,

      // Cron restart (opcional - reinicio diario a las 3 AM)
      // cron_restart: '0 3 * * *',

      // Avanzado
      exp_backoff_restart_delay: 100,
      instance_var: 'INSTANCE_ID',
    }
  ],

  // Configuración de deployment (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    }
  }
};
