# automanews.com.br

**AutomaNews** is a collaborative content platform focused on **home automation** and **smart home technologies**.

Inspired by [TabNews](https://www.tabnews.com.br/), the project brings together news, tutorials, reviews, and community discussions around the world of connected homes.

---

## Features

- **News** — Latest updates on Smart Home, Matter, Zigbee, Z-Wave, and more
- **Tutorials** — Step-by-step guides for beginners and advanced users
- **Reviews** — Comparisons and analyses of devices, hubs, and assistants
- **Community** — Open space for sharing experiences and knowledge

---

## Tech Stack

| Layer            | Technology                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Framework        | [Next.js 14](https://nextjs.org/) (Pages Router)                                              |
| HTTP routing     | [next-connect](https://github.com/hoangvvo/next-connect)                                      |
| Database         | [PostgreSQL 16](https://www.postgresql.org/) via [pg](https://node-postgres.com/)             |
| Email (dev/test) | [MailCatcher](https://mailcatcher.me/) — SMTP on `1025`, web UI on `1080`                     |
| Auth             | Session cookies + [bcryptjs](https://github.com/dcodeIO/bcrypt.js)                            |
| Containerization | [Docker](https://www.docker.com/)                                                             |
| Migrations       | [node-pg-migrate](https://github.com/salsita/node-pg-migrate)                                 |
| Testing          | [Jest](https://jestjs.io/) (integration-first, against the live stack)                        |
| Linting          | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)                              |
| Commits          | [Commitizen](https://github.com/commitizen/cz-cli) + [Commitlint](https://commitlint.js.org/) |

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) LTS/Hydrogen (v18) — see `.nvmrc`
- [Docker](https://www.docker.com/)

### Installation

```bash
git clone https://github.com/joaohenriquecosta/automanews.git
cd automanews
npm install
```

### Running the App

```bash
npm run dev
```

This single command handles the full startup sequence:

1. Starts the PostgreSQL and MailCatcher containers via Docker Compose
2. Waits for the database to accept connections
3. Runs pending migrations
4. Launches the Next.js dev server at `http://localhost:3000`

> **Note:** When the dev server is stopped, the `postdev` script automatically stops the infrastructure containers.

### Services

| Service     | Command                                      | Port(s)         |
| ----------- | -------------------------------------------- | --------------- |
| PostgreSQL  | `docker compose -f infra/compose.yaml up -d` | `5432`          |
| MailCatcher | (started by the same compose file)           | `1025` / `1080` |
| Next.js     | `npx next dev`                               | `3000`          |

MailCatcher's web UI is available at [http://localhost:1080](http://localhost:1080) for inspecting outgoing emails (e.g. account activation links) during development.

---

## Available Scripts

| Script                        | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `npm run dev`                 | Start all services and launch the dev server       |
| `npm test`                    | Run the test suite (starts services automatically) |
| `npm run test:watch`          | Run tests in watch mode                            |
| `npm run lint:prettier:check` | Check code formatting with Prettier                |
| `npm run lint:prettier:fix`   | Auto-fix formatting with Prettier                  |
| `npm run lint:eslint:check`   | Run ESLint checks                                  |
| `npm run services:up`         | Start infrastructure containers only               |
| `npm run services:stop`       | Pause containers (preserves data)                  |
| `npm run services:down`       | Remove containers and networks                     |
| `npm run migrations:up`       | Run pending database migrations                    |
| `npm run migrations:down`     | Rollback the last migration                        |
| `npm run migrations:create`   | Create a new migration file                        |
| `npm run commit`              | Create a commit using Commitizen                   |

---

## Testing

Tests run against a live Next.js server backed by PostgreSQL and MailCatcher — no mocks. The test suite starts all services automatically:

```bash
npm test
```

For development with watch mode:

```bash
npm run test:watch
```

> Tests use `--runInBand` to run sequentially. The test orchestrator (`tests/orchestrator.js`) resets the database between suites to ensure a clean state, and unit tests for pure modules live under `tests/unit/`.

---

## Project Structure

```
.
├── infra/
│   ├── compose.yaml             # PostgreSQL + MailCatcher
│   ├── controller.js            # Shared route middleware (auth, error handling)
│   ├── database.js              # Database client (pg)
│   ├── errors.js                # Error classes with Portuguese user-facing messages
│   ├── mailer.js                # SMTP client (nodemailer)
│   ├── webserver.js             # Origin/URL helpers
│   ├── migrations/              # node-pg-migrate files
│   └── scripts/                 # Dev/test orchestration helpers
├── models/
│   ├── activation.js            # Account activation tokens + email
│   ├── authentication.js        # Email + password auth (timing-safe)
│   ├── authorization.js         # Feature-based permissions + output filtering
│   ├── migrator.js              # Migration runner wrapper
│   ├── password.js              # bcryptjs hashing/compare
│   ├── session.js               # Session creation, lookup, refresh, expiry
│   ├── status.js                # System health
│   └── user.js                  # User CRUD + features
├── pages/
│   ├── index.js                 # Homepage Placeholder (in construction)
│   ├── status/index.js          # System status page
│   └── api/v1/
│       ├── activations/[token]/ # PATCH — activate user from token
│       ├── migrations/          # GET|POST — pending migrations
│       ├── sessions/            # POST|DELETE — login / logout
│       ├── status/              # GET — system status
│       ├── user/                # GET — current user (refreshes session)
│       └── users/               # POST — register; GET|PATCH /[username]
├── tests/
│   ├── orchestrator.js          # Shared helpers, DB reset, mailcatcher utils
│   ├── setup-jest.js            # Per-test advisory lock
│   ├── integration/             # API + flow tests against the live stack
│   └── unit/                    # Pure-module unit tests
├── .env.development             # Local environment variables
├── jest.config.js               # Jest configuration
└── package.json
```

---

## API Endpoints

| Method | Endpoint                      | Required feature        | Description                                                |
| ------ | ----------------------------- | ----------------------- | ---------------------------------------------------------- |
| GET    | `/api/v1/status`              | `read:status`           | System health and database info                            |
| GET    | `/api/v1/migrations`          | `read:migration`        | Lists pending migrations (dry run)                         |
| POST   | `/api/v1/migrations`          | `create:migration`      | Executes pending migrations                                |
| POST   | `/api/v1/users`               | `create:user`           | Register a new user                                        |
| GET    | `/api/v1/users/[username]`    | —                       | Public user profile by username                            |
| PATCH  | `/api/v1/users/[username]`    | `update:user`           | Update a user (self; others requires `update:user:others`) |
| GET    | `/api/v1/user`                | `read:session`          | Current authenticated user (refreshes session cookie)      |
| POST   | `/api/v1/sessions`            | `create:session`        | Log in (email + password)                                  |
| DELETE | `/api/v1/sessions`            | valid session cookie    | Log out (expires the session)                              |
| PATCH  | `/api/v1/activations/[token]` | `read:activation_token` | Activate an account from an emailed token                  |

Authorization is feature-based: each user row has a `features: varchar[]` column, and routes are gated by named features rather than roles. Defaults are applied for anonymous, unactivated, and activated users; additional features can be granted per user.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Use Commitizen for commits: `npm run commit`
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) standard enforced by Commitlint and Husky.

---

## License

This project is licensed under the [MIT License](LICENSE).
