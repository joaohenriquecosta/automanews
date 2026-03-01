import db from "infra/database";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const dbVersionResult = await db.query("SHOW server_version;");
    const dbVersionValue = dbVersionResult.rows[0].server_version;

    const dbMaxConnectionsResult = await db.query("SHOW max_connections;");
    const dbMaxConnectionsValue = parseInt(
      dbMaxConnectionsResult.rows[0].max_connections,
    );

    const dbName = process.env.POSTGRES_DB;
    const dbOpenedConnectionsResult = await db.query({
      text: `SELECT COUNT(*) AS opened_connections FROM pg_stat_activity WHERE datname = $1;`,
      values: [dbName],
    });
    const dbOpenedConnectionsValue = parseInt(
      dbOpenedConnectionsResult.rows[0].opened_connections,
    );

    const responseBody = {
      updated_at: updatedAt,
      dependencies: {
        db: {
          version: dbVersionValue,
          max_connections: dbMaxConnectionsValue,
          opened_connections: dbOpenedConnectionsValue,
        },
      },
    };

    return response.status(200).json(responseBody);
  } catch (error) {
    const publicError = new InternalServerError({
      cause: error,
    });
    return response.status(publicError.statusCode).json(publicError);
  }
}

export default status;
