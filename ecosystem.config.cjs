module.exports = {
  apps: [
    {
      name: 'kvutsa-mcp',
      script: 'dist/server.js',

      // One process: the server is stateless, so 'cluster' mode works too when more are needed.
      instances: 1,
      exec_mode: 'fork',

      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown: server.ts force-exits after 10s, so give it a little longer.
      kill_timeout: 15000,
      listen_timeout: 10000,

      log_date_format: 'DD-MM-YYYY HH:mm:ss.SSS Z',
      time: true,

      // Pass NODE_ENV when starting PM2, e.g. NODE_ENV=prod pm2 start ecosystem.config.cjs
      env: {
        NODE_ENV: process.env.NODE_ENV || 'local',
      },
    },
  ],
};
