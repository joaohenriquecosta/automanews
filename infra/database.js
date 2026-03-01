/*
 * INFRASTRUCTURE LAYER: Database Client
 * This module follows the official 'node-postgres' one-shot client pattern.
 * In MVC, this provides the interface between Models and the PostgreSQL driver.
 */

import { Client } from "pg";

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    return await client.query(queryObject);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  // The Client automatically looks for PGPASSWORD, PGUSER, etc. in process.env
  // if no config object is passed, but explicit config is safer for Next.js.
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === "production",
  });
  await client.connect();
  return client;
}

const db = {
  query,
  getNewClient,
};

export default db;
