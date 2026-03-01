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
| Database         | [PostgreSQL 16](https://www.postgresql.org/)                                                  |
| Containerization | [Docker](https://www.docker.com/)                                                             |
| Migrations       | [node-pg-migrate](https://github.com/salsita/node-pg-migrate)                                 |
| Testing          | [Jest](https://jestjs.io/)                                                                    |
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

1. Starts the PostgreSQL container via Docker Compose
2. Waits for the database to accept connections
3. Runs pending migrations
4. Launches the Next.js dev server at `http://localhost:3000`

> **Note:** When the dev server is stopped, the `postdev` script automatically stops the database container.

### Services

| Service | Command | Port |
|---|---|---|
| PostgreSQL | `docker compose -f infra/compose.yaml up -d` | 5432 |
| Next.js | `npx next dev` | 3000 |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start all services and launch the dev server |
| `npm test` | Run integration tests (starts services automatically) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint:prettier:check` | Check code formatting with Prettier |
| `npm run lint:prettier:fix` | Auto-fix formatting with Prettier |
| `npm run lint:eslint:check` | Run ESLint checks |
| `npm run services:up` | Start infrastructure containers only |
| `npm run services:stop` | Pause containers (preserves data) |
| `npm run services:down` | Remove containers and networks |
| `npm run migrations:up` | Run pending database migrations |
| `npm run migrations:down` | Rollback the last migration |
| `npm run migrations:create` | Create a new migration file |
| `npm run commit` | Create a commit using Commitizen |

---

## Testing

Integration tests run against a live Next.js server backed by PostgreSQL. The test suite starts all services automatically:

```bash
npm test
```

For development with watch mode:

```bash
npm run test:watch
```

> Tests use `--runInBand` to run sequentially. The test orchestrator (`tests/orchestrator.js`) resets the database between suites to ensure a clean state.

---

## Project Structure

```
.
├── infra/
│   ├── compose.yaml          # Docker Compose for PostgreSQL
│   ├── database.js            # Database client (pg)
│   ├── migrations/            # Database migration files
│   └── scripts/
│       └── wait-for-postgres.js
├── pages/
│   ├── index.js               # Homepage
│   ├── status/
│   │   └── index.js           # System status page
│   └── api/v1/
│       ├── status/index.js    # GET /api/v1/status
│       └── migrations/index.js # GET|POST /api/v1/migrations
├── tests/
│   ├── orchestrator.js        # Test setup and DB helpers
│   └── integration/
│       └── api/v1/
│           ├── status/        # Status endpoint tests
│           └── migrations/    # Migration endpoint tests
├── .env.development           # Local environment variables
├── jest.config.js             # Jest configuration
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/status` | Returns system health and database info |
| GET | `/api/v1/migrations` | Lists pending migrations (dry run) |
| POST | `/api/v1/migrations` | Executes pending migrations |

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
