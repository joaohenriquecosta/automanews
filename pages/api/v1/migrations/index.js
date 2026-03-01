import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import db from "infra/database";

export default async function migrations(request, response) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(request.method)) {
    return response
      .status(405)
      .json({ error: `Method { ${request.method} } Not Allowed` });
  }
  let dbClient;

  try {
    dbClient = await db.getNewClient();
    const defaultMigrationsOptions = {
      dryRun: true,
      verbose: true,
      direction: "up",
      dbClient: dbClient,
      migrationsTable: "pgmigrations",
      dir: resolve("infra", "migrations"),
    };

    if (request.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationsOptions);
      return response.status(200).json(pendingMigrations);
    }

    if (request.method === "POST") {
      const migratedMigrations = await migrationRunner({
        ...defaultMigrationsOptions,
        dryRun: false,
      });
      if (migratedMigrations.length > 0) {
        return response.status(201).json(migratedMigrations);
      }
      return response.status(200).json(migratedMigrations);
    }
  } catch (error) {
    console.error("Migration error:", error);
    return response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await dbClient.end();
  }
}
