const path = require("path");
const os = require("os");

const rootDir = path.join(__dirname, "..");
const logDir = path.join(os.homedir(), ".pm2", "logs");

module.exports = {
  apps: [
    {
      name: "sbexpresscargo-frontend",
      cwd: rootDir,
      // Matches package.json "start": "next start"
      script: path.join(rootDir, "node_modules", ".bin", "next"),
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      node_args: '--max-old-space-size=1024',
      max_memory_restart: '800M',
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      error_file: path.join(logDir, "sbexpresscargo-frontend-error.log"),
      out_file: path.join(logDir, "sbexpresscargo-frontend-out.log"),
      merge_logs: true,
    },
  ],
};
