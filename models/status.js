import { query } from "infra/database";
import { ServiceError } from "infra/errors";

async function getSystemStatus() {
  const updatedAt = new Date().toISOString();
  const dbVersionValue = await getDbVersion();
  const dbMaxConnectionsValue = await getDbMaxConnections();
  const dbOpenedConnectionsValue = await getDbOpenedConnections();

  if (!dbVersionValue || !dbMaxConnectionsValue || !dbOpenedConnectionsValue) {
    throw new ServiceError({
      cause: new Error("Failed to get database status."),
      message: "Não foi possível obter o status do banco de dados.",
      action:
        "Verifique se o banco de dados está online e se as credenciais estão corretas.",
    });
  }

  const dbStatus = {
    updated_at: updatedAt,
    dependencies: {
      db: {
        version: dbVersionValue,
        max_connections: dbMaxConnectionsValue,
        opened_connections: dbOpenedConnectionsValue,
      },
    },
  };
  return dbStatus;
}

async function getDbVersion() {
  const dbVersionResult = await query("SHOW server_version;");
  return dbVersionResult.rows[0].server_version;
}

async function getDbMaxConnections() {
  const dbMaxConnectionsResult = await query("SHOW max_connections;");
  return parseInt(dbMaxConnectionsResult.rows[0].max_connections);
}

async function getDbOpenedConnections() {
  const dbOpenedConnectionsResult = await query({
    text: `
      SELECT COUNT(*) AS
        opened_connections
      FROM
       pg_stat_activity
      WHERE
        datname = $1
      ;`,
    values: [process.env.POSTGRES_DB],
  });
  return parseInt(dbOpenedConnectionsResult.rows[0].opened_connections);
}

export { getSystemStatus };
