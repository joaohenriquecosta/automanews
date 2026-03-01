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

git clone https://github.com/joaohenriquecosta/automanews.git
cd automanews
npm install
