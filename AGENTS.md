# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 14 (Pages Router) app backed by PostgreSQL 16 via Docker. The `.nvmrc` specifies `lts/hydrogen` (Node 18).

### Services

| Service | How to start | Port |
|---|---|---|
| PostgreSQL | `docker compose -f infra/compose.yaml up -d` | 5432 |
| Next.js dev | `npx next dev` | 3000 |

### Gotchas

- **Docker must be running** before any `npm run dev` or `npm test` command, since those scripts invoke `docker compose` internally. If Docker is not started, run `sudo dockerd &>/tmp/dockerd.log &` and `sudo chmod 666 /var/run/docker.sock`.
- `npm run dev` chains: services:up → wait-for-postgres → migrations:up → next dev. The `postdev` script auto-stops the DB container, so if you stop the dev server normally the DB will be stopped too.
- `npm test` similarly starts services, launches Next.js + Jest via `concurrently`, and `posttest` stops the DB. Tests run in-band (`--runInBand`) against a live Next.js server at `localhost:3000`.
- The test orchestrator (`tests/orchestrator.js`) calls `clearDatabase()` which drops and recreates the public schema. Tests expect a fresh DB state.
- All environment configuration is in `.env.development` (checked in). No secrets are needed.

### Common commands

See `package.json` scripts. Key ones:

- **Lint:** `npm run lint:prettier:check` and `npm run lint:eslint:check`
- **Test:** `npm test` (starts services, runs Jest, stops services)
- **Dev:** `npm run dev` (starts services, waits for DB, runs migrations, starts Next.js)
- **Migrations:** `npm run migrations:up` / `npm run migrations:down`
