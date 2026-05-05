# AutomaNews

Collaborative content platform for home automation topics, targeting a Brazilian audience. Modeled after [TabNews](https://tabnews.com.br), built through [curso.dev](https://curso.dev).

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, Pages Router (not App Router) |
| Database | PostgreSQL 16 via Docker Compose (`infra/compose.yaml`) |
| Email (dev/test) | MailCatcher — SMTP :1025, web UI :1080 |
| HTTP routing | `next-connect` (Express-style middleware inside API routes) |
| Queries | Raw SQL via `pg` + `node-pg-migrate` |
| Auth | Session-based; `features: varchar[]` on the user row drives authorization |
| Testing | Jest, integration-only against live stack |
| Linting | ESLint + Prettier |
| Commits | Commitizen + commitlint (conventional commits) |

## Services

| Service | Start command | Port |
|---------|--------------|------|
| PostgreSQL | `docker compose -f infra/compose.yaml up -d` | 5432 |
| MailCatcher | (same compose) | 1025 / 1080 |
| Next.js dev | `npx next dev` | 3000 |

Docker must be running before any `npm run dev` or `npm test` command — those scripts invoke `docker compose` internally.

## Common commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start services + migrations + Next.js |
| `npm test` | Full test suite (starts services, runs Jest, stops services) |
| `npm run test:watch` | Jest in watch mode |
| `npm run commit` | Commitizen guided commit |
| `npm run lint:prettier:fix` | Auto-fix formatting |
| `npm run lint:eslint:check` | ESLint check |
| `npm run migrations:up` | Run pending migrations |
| `npm run migrations:create` | Create a new migration file |

## Language convention

| Layer | Language |
|-------|----------|
| Code — variables, functions, comments, docs | English |
| User-facing strings — `message` and `action` fields in API responses and errors | Portuguese (PT-BR) |

## Architecture decisions

These are intentional choices from the curso.dev curriculum. Do not propose replacing them without a strong reason.

- **Pages Router over App Router** — simpler, more mature, follows the curriculum.
- **`next-connect`** — enables Express-style middleware chaining inside Next.js API routes.
- **Integration-first testing** — tests hit the real database and real Next.js server at `localhost:3000`. No mocking. Real bugs surface in real stacks.
- **Feature-based authorization** — `user.features` is a `varchar[]` column. Permissions are checked at runtime by feature name (`models/authorization.js`). No role hierarchy — features are explicit strings.
- **Error shape** — every error has `name`, `status_code`, `message` (PT-BR, user-safe), `action` (PT-BR, suggested next step). Always use the classes in `infra/errors.js`.

## Test conventions

- `clearDatabase()` + `runPendingMigrations()` runs in `beforeEach` for isolated tests, or `beforeAll` for flow tests that chain state across sequential cases.
- `expect.assertions(n)` guards against silent passes when async code throws before assertions. Count includes assertions inside helper functions.
- Shared helpers and DB utilities live in `tests/orchestrator.js`.
- `clearDatabase()` drops and recreates the public schema — it is destructive and **test-only**. Never call it from application code.

## Migration rules

- Migrations are in `infra/migrations/`, numbered sequentially.
- **Existing migrations are immutable.** Never edit one after it has been created. Create a new migration to change schema.
- All timestamp defaults and SQL comparisons use `timezone('utc', now())` — not `now()` or `NOW()`.
- Names follow Rails conventions adapted to kebab-case (node-pg-migrate default):

  | Action | Pattern | Example |
  |--------|---------|---------|
  | New table | `create-<table>` | `create-users` |
  | Add column | `add-<column>-to-<table>` | `add-email-to-users` |
  | Remove column | `remove-<column>-from-<table>` | `remove-password-from-users` |
  | Rename column | `rename-<column>-in-<table>` | `rename-username-in-users` |
  | Change constraint/type | `change-<column>-in-<table>` | `change-email-in-users` |

## In-progress work

**Next feature: `filter-output`** — field-level output filtering owned by `models/authorization.js`, called at the controller boundary.

Two reference files exist at the project root:
- `filter-output.diff` — proposed implementation from Cursor Composer
- `filter-output-considerations.diff` — review notes with specific concerns about that implementation

Read both before touching this feature. The central design question: should `filterOutput` accept a feature argument to vary the projection per context (`read:user` vs `read:session`)?

## Sensitive areas

Do not modify without explicit discussion:

1. **`models/authentication.js`** — uses `getAuthDummyPasswordHash()` so timing is constant whether or not the email exists. This prevents user enumeration via timing attacks. Never simplify or optimize this flow.
2. **`infra/errors.js` → `AuthenticationError.toJSON()`** — deliberately omits `cause` so internal error details never reach clients (anti-enumeration). Do not add `cause` to it.
3. **Existing migrations** — immutable once created (see above).
4. **`tests/orchestrator.js` → `clearDatabase()`** — destructive by design, test-only.
5. **Password hashing** — `bcryptjs`. Do not change the algorithm or cost factor.
6. **Session token entropy** — `randomBytes(48)`. Do not reduce.

## Gotchas

- `npm run dev` chains: services:up → wait-for-postgres → migrations:up → next dev. The `postdev` script auto-stops the DB container, so stopping the dev server also stops the DB.
- `npm test` similarly starts services, launches Next.js + Jest via `concurrently`, and `posttest` stops the DB. Tests run in-band (`--runInBand`) against a live server at `localhost:3000`.
- All environment config is in `.env.development` (committed). No secrets needed to run the project.
- The test orchestrator calls `clearDatabase()` which drops and recreates the public schema. Tests always expect a fresh DB state.
