/*
 * INFRASTRUCTURE LAYER: Database Client
 * This module follows the official 'node-postgres' one-shot client pattern.
 * In MVC, this provides the interface between Models and the PostgreSQL driver.
 */

import { Client } from "pg";

async function query(queryObject) {
  // The Client automatically looks for PGPASSWORD, PGUSER, etc. in process.env
  // if no config object is passed, but explicit config is safer for Next.js.
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  });

  await client.connect();

  try {
    // Execute the query passed by the Model
    const result = await client.query(queryObject);
    return result;
  } catch (err) {
    // Capture errors during query execution
    console.error("Infrastructure Error: Query failed", err);
    throw err;
  } finally {
    // Crucial: Always close the connection to prevent "Too many clients" errors
    await client.end();
  }
}

export default {
  query: query,
};
