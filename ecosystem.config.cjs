module.exports = {
  apps: [
    {
      name: 'elec-console',
      cwd: __dirname,
      script: './.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NITRO_PORT: 3000,
      },
    },
  ],
}
