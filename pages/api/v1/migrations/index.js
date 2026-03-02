import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import db from "infra/database";
import { exceptionHandlers } from "infra/controller";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

function defaultMigrationsOptions(dbClient, overrides = {}) {
  return {
    dryRun: true,
    verbose: true,
    direction: "up",
    dbClient,
    migrationsTable: "pgmigrations",
    dir: resolve("infra", "migrations"),
    ...overrides,
  };
}

async function getHandler(request, response) {
  let dbClient;
  try {
    dbClient = await db.getNewClient();
    const pendingMigrations = await migrationRunner(
      defaultMigrationsOptions(dbClient),
    );
    return response.status(200).json(pendingMigrations);
  } finally {
    await dbClient?.end();
  }
}

async function postHandler(request, response) {
  let dbClient;
  try {
    dbClient = await db.getNewClient();
    const migratedMigrations = await migrationRunner(
      defaultMigrationsOptions(dbClient, { dryRun: false }),
    );
    const statusCode = migratedMigrations.length > 0 ? 201 : 200;
    return response.status(statusCode).json(migratedMigrations);
  } finally {
    await dbClient?.end();
  }
}
