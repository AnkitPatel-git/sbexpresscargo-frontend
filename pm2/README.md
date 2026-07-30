# PM2 deployment

Run the Next.js app with [PM2](https://pm2.keymetrics.io/) for process management on a server.

## Dev and prod on the same server (separate repos)

Each deploy has its own repo and `.env`. PM2 process names are global on the host, so set a **unique** `PM2_APP_NAME` in each repo:

**Dev repo `.env`:**

```env
PM2_APP_NAME=dev-sbexpresscargo-frontend
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://dev.backend.portal.sbexpresscargo.com/api
API_BACKEND_URL=https://dev.backend.portal.sbexpresscargo.com/api
```

**Prod repo `.env`:**

```env
PM2_APP_NAME=prod-sbexpresscargo-frontend
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://backend.portal.sbexpresscargo.com/api
API_BACKEND_URL=https://backend.portal.sbexpresscargo.com/api
```

`ecosystem.config.cjs` loads `.env` before start. Use a different `PORT` per repo. Next.js reads `NEXT_PUBLIC_*` and `API_BACKEND_URL` from the environment at build/runtime as usual.

## Prerequisites

- [PM2](https://pm2.keymetrics.io/): `npm install -g pm2`
- Dependencies: `npm install`

## Commands

From that repo’s project root:

```bash
npm run pm2:start     # builds, then starts
npm run pm2:stop
npm run pm2:restart   # builds, then restarts
pm2 logs $PM2_APP_NAME
pm2 status
pm2 save
```

`pm2:start` / `pm2:restart` run `npm run build` first (creates `.next`), then call PM2.

After code changes: `npm run pm2:restart`.

## Config summary

| Setting | Source |
|--------|--------|
| App name | `PM2_APP_NAME` in `.env` |
| Command | `next start` |
| `PORT` | `.env` (default `3000`) |
| `NODE_ENV` | `.env` (default `production`) |
| Max memory restart | `800M` |
| Logs | `~/.pm2/logs/<PM2_APP_NAME>-{out,error}.log` |

## Optional: persist across reboots

```bash
pm2 save
pm2 startup
```

Follow the printed instructions so PM2 respawns your saved process list on boot.
