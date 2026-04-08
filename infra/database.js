import { Client } from "pg";
import { ServiceError } from "infra/errors.js";

export { query, getNewClient };

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
  } catch (error) {
    const publicError = new ServiceError({
      cause: error,
      message: "Erro na conexão com o Banco de Dados.",
    });
    console.error(publicError);
    throw publicError;
  }

  try {
    return await client.query(queryObject);
  } catch (error) {
    const publicError = new ServiceError({
      cause: error,
      message: "Erro na Query ao Banco de Dados.",
    });
    console.error(publicError);
    throw publicError;
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
  await client.query("SET timezone = 'UTC'");
  return client;
}
