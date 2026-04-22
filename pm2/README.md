# PM2 — sbexpresscargo-frontend

Production process manager setup for this Next.js app. The app name is **`sbexpresscargo-frontend`**.

## Prerequisites

- [PM2](https://pm2.keymetrics.io/) installed globally: `npm install -g pm2`
- Dependencies installed at the **project root**: `npm install`
- A production build: **`npm run build`** (PM2 runs `next start`, which requires `.next` output from a prior build)

## Start

From the **repository root** (parent of this `pm2/` folder):

```bash
pm2 start pm2/ecosystem.config.cjs
```

Or from inside `pm2/`:

```bash
cd pm2 && pm2 start ecosystem.config.cjs
```

The config sets `NODE_ENV=production` and **`PORT=3000`**. Override the port for a one-off start:

```bash
PORT=8080 pm2 start pm2/ecosystem.config.cjs
```

(For a permanent change, edit `env.PORT` in `ecosystem.config.cjs` or add a second `env_*` block as needed.)

## Stop

```bash
pm2 stop sbexpresscargo-frontend
```

To remove it from PM2’s process list:

```bash
pm2 delete sbexpresscargo-frontend
```

## Restart

After code or config changes (rebuild first if application code changed):

```bash
npm run build
pm2 restart sbexpresscargo-frontend
```

Reload with zero-downtime is not typical for a single forked Next server; use **`restart`** for this app.

## Monitor

| Command | Purpose |
|--------|---------|
| `pm2 status` | List apps and CPU/memory/uptime |
| `pm2 monit` | TUI dashboard (CPU, memory, logs tail) |
| `pm2 logs sbexpresscargo-frontend` | Stream stdout/stderr |
| `pm2 logs sbexpresscargo-frontend --lines 200` | Last 200 lines then stream |

Log files are written under **`~/.pm2/logs/`** (see `out_file` / `error_file` in `ecosystem.config.cjs`).

## Config summary

| Setting | Value |
|--------|--------|
| App name | `sbexpresscargo-frontend` |
| Command | `next start` (via `node_modules/.bin/next`) |
| Working directory | Project root |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| Max memory restart | `500MB` |
| Auto-restart on crash | Yes (`autorestart: true`) |

## Optional: persist across reboots

```bash
pm2 save
pm2 startup
```

Follow the printed instructions so PM2 respawns your saved process list on boot.
