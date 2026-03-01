import db from "infra/database";
import { InternalServerError, MethodNotAllowedError } from "infra/errors";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, request, response) {
  const publicError = new InternalServerError({
    cause: error,
  });
  return response.status(publicError.statusCode).json(publicError);
}

async function getHandler(request, response) {
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
}
