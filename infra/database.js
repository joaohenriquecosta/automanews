import { Client } from "pg";

async function query(queryObject) {
  const e = process.env;
  const client = new Client({
    host: e.POSTGRES_HOST,
    port: e.POSTGRES_PORT,
    user: e.POSTGRES_USER,
    database: e.POSTGRES_DB,
    password: e.POSTGRES_PASSWORD,
  });
  await client.connect();
  const result = await client.query(queryObject);
  await client.end();
  return result;
}

export default {
  query: query,
};
