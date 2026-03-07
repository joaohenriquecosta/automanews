import { query } from "infra/database";
import { exceptionHandlers } from "infra/controller";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const dbVersionResult = await query("SHOW server_version;");
  const dbVersionValue = dbVersionResult.rows[0].server_version;

  const dbMaxConnectionsResult = await query("SHOW max_connections;");
  const dbMaxConnectionsValue = parseInt(
    dbMaxConnectionsResult.rows[0].max_connections,
  );

  const dbName = process.env.POSTGRES_DB;
  const dbOpenedConnectionsResult = await query({
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
