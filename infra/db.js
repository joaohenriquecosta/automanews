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

  try {
    try {
      await client.connect();
    } catch (connectError) {
      console.error("Infrastructure Error: Connection failed", connectError);
      throw connectError; // Erro específico de conexão (ex: banco offline, credenciais erradas)
    }

    try {
      const result = await client.query(queryObject);
      return result;
    } catch (queryError) {
      console.error("Infrastructure Error: Query execution failed", queryError);
      throw queryError; // Erro específico de SQL (ex: erro de sintaxe, tabela não existe)
    }
  } finally {
    await client.end();
  }
}

export default {
  query: query,
};
