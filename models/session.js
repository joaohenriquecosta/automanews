import { randomBytes } from "node:crypto";
import { query } from "infra/database.js";
import { getAuthenticatedUser } from "models/authentication.js";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export { createSession, SESSION_LIFETIME_MS };

async function createSession({ email, password }) {
  const user = await getAuthenticatedUser(email, password);
  const userId = user.id;
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  const session = await insertSessionQuery({ token, userId, expiresAt });
  return session;
}

async function insertSessionQuery({ token, userId, expiresAt }) {
  const result = await query({
    text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [token, userId, expiresAt],
  });
  return result.rows[0];
}
