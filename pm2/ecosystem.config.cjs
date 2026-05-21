const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const projectRoot = path.resolve(__dirname, '..');
const logDir = path.join(os.homedir(), '.pm2', 'logs');

// Unique per deploy — set in each repo's .env (dev vs prod on the same server).
const appName = process.env.PM2_APP_NAME || 'sbexpresscargo-frontend';
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'production';

module.exports = {
  apps: [
    {
      name: appName,
      cwd: projectRoot,
      script: path.join(projectRoot, 'node_modules', '.bin', 'next'),
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      node_args: '--max-old-space-size=1024',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: nodeEnv,
        PORT: port,
      },
      error_file: path.join(logDir, `${appName}-error.log`),
      out_file: path.join(logDir, `${appName}-out.log`),
      merge_logs: true,
      time: true,
    },
  ],
};
