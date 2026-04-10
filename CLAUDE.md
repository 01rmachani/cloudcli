# CLAUDE.md — AI Assistant Guide for cloudcli

This file gives AI coding assistants context about this repository so they can
provide accurate, safe, and consistent help.

## What This Repo Does

This is a **Docker deployment wrapper** for `@cloudcli-ai/cloudcli`, an
AI-powered coding assistant that runs in the browser.

It adds:
- A `Dockerfile` to containerize CloudCLI with all required native build deps
- `seed-user.js` — a bootstrap script that provisions SQLite users from OAuth2
  proxy headers before CloudCLI starts
- `docker-compose.yml` for local development

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container definition; installs system deps, global npm packages, copies seed script |
| `seed-user.js` | Reads `X_AUTH_REQUEST_USER`/`X_AUTH_REQUEST_EMAIL` env vars and upserts user row into SQLite |
| `docker-compose.yml` | Local dev convenience; mounts a named volume for the SQLite database |
| `.env.example` | Documents all supported environment variables |

## Architecture

```
Docker container start
  └─ node /usr/local/bin/seed-user.js   # provision user from env vars
  └─ cloudcli start                      # launch on port 3001
```

The SQLite database lives at `DATABASE_PATH` (default `/root/.cloudcli/auth.db`).
Users are identified by `username` (unique). The `password_hash` column is set
to the literal string `'oauth2_managed'` for OAuth2-provisioned users — the app
skips local password checks for those rows.

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `X_AUTH_REQUEST_USER` | `admin` | Username injected by OAuth2 proxy |
| `X_AUTH_REQUEST_EMAIL` | `admin@example.com` | Email injected by OAuth2 proxy |
| `DATABASE_PATH` | `/root/.cloudcli/auth.db` | SQLite file path inside container |
| `VITE_IS_PLATFORM` | `true` | CloudCLI platform/multi-user mode |

## Common Dev Tasks

### Build & run locally
```bash
cp .env.example .env          # customise if needed
docker compose up --build
```

### View bootstrap logs
```bash
docker compose logs cloudcli | grep BOOTSTRAP
```

### Lint the seed script
```bash
npm install
npm run lint
npm run format
```

### Rebuild after Dockerfile changes
```bash
docker compose down
docker compose up --build
```

## Coding Guidelines for AI Assistants

- **Do not** store real credentials or passwords in `seed-user.js`; the
  `oauth2_managed` placeholder is intentional.
- **Do not** add `npm install` or a `node_modules/` folder inside the container;
  all packages are installed globally via `npm install -g`.
- The `seed-user.js` schema must stay in sync with
  `claudecodeui/server/database/init.sql` in the upstream CloudCLI project.
- Keep `Dockerfile` single-stage; the build steps (Python3, make, g++) are only
  needed to compile `better-sqlite3` and should remain in the same layer group
  as the `npm install -g` step for cache efficiency.
- Port `3001` is the canonical CloudCLI port — do not change it unless there is
  a very good reason.
