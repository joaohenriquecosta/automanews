/*
 * CONTROLLER LAYER: Status Handler
 * This controller orchestrates the health check of the application's dependencies.
 * In MVC, it receives the request, calls the Infrastructure Layer, and returns the View.
 */

import db from "infra/database.js";
import util from "util";

async function status(request, response) {
  // Snapshot of the current time in ISO format
  const updatedAt = new Date().toISOString();

  // Fetch database engine version
  const dbVersionResult = await db.query("SHOW server_version;");
  const dbVersionValue = dbVersionResult.rows[0].server_version;

  // Fetch the configured limit for concurrent connections
  const dbMaxConnectionsResult = await db.query("SHOW max_connections;");
  const dbMaxConnectionsValue = parseInt(
    dbMaxConnectionsResult.rows[0].max_connections,
  );

  // Use a parameterized query to count active sessions for the current database
  const dbName = process.env.POSTGRES_DB;
  const dbOpenedConnectionsResult = await db.query({
    text: `SELECT COUNT(*) AS opened_connections FROM pg_stat_activity WHERE datname = $1;`,
    values: [dbName],
  });
  const dbOpenedConnectionsValue = parseInt(
    dbOpenedConnectionsResult.rows[0].opened_connections,
  );

  // Construct the standardized response object
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

  // Log the gathered information for server-side monitoring
  console.log(
    util.inspect(responseBody, {
      depth: null, // Ensures it prints all nested levels
      colors: true, // Adds syntax highlighting to the terminal
      compact: false, // Forces each property onto a new line
    }),
  );

  // Return the compiled status report as a JSON View
  response.status(200).json(responseBody);
}

export default status;
