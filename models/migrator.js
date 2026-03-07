import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import { getNewClient } from "infra/database";
import { ServiceError } from "infra/errors";

function defaultMigrationsOptions(dbClient, overrides = {}) {
  return {
    dryRun: true,
    verbose: true,
    direction: "up",
    dbClient,
    log: () => {},
    migrationsTable: "pgmigrations",
    dir: resolve("infra", "migrations"),
    ...overrides,
  };
}

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await getNewClient();
    const pendingMigrations = await migrationRunner(
      defaultMigrationsOptions(dbClient),
    );
    return pendingMigrations;
  } catch (error) {
    const publicError = new ServiceError({
      cause: error,
      message: "Erro ao listar as migrações pendentes.",
    });
    console.error(publicError);
    throw publicError;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await getNewClient();
    const migratedMigrations = await migrationRunner(
      defaultMigrationsOptions(dbClient, { dryRun: false }),
    );
    return migratedMigrations;
  } catch (error) {
    const publicError = new ServiceError({
      cause: error,
      message: "Erro ao executar as migrações pendentes.",
    });
    console.error(publicError);
    throw publicError;
  } finally {
    await dbClient?.end();
  }
}

export { listPendingMigrations, runPendingMigrations };
