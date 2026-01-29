import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import db from "infra/database.js";

export default async function migrations(request, response) {
  const dbClient = await db.getNewClient();
  const defaultMigrationsOptions = {
    dryRun: true,
    verbose: true,
    direction: "up",
    dbClient: dbClient,
    migrationsTable: "pgmigrations",
    dir: join("infra", "migrations"),
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationsOptions);
    await dbClient.end();
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationsOptions,
      dryRun: false,
    });
    await dbClient.end();
    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  }

  return response.status(405).json({ error: "Method Not Allowed" });
}
