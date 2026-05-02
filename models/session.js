import { randomBytes } from "node:crypto";
import { query } from "infra/database.js";
import { AuthenticationError } from "infra/errors.js";
import { getUserById } from "models/user.js";

export {
  createSession,
  getValidSessionByToken,
  refreshSession,
  SESSION_LIFETIME_MS,
  expireSessionById,
};

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

async function createSession(userId) {
  const user = await getUserById(userId);
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  const session = await insertSessionQuery({
    token,
    userId: user.id,
    expiresAt,
  });
  return session;
}

async function getValidSessionByToken(token) {
  const session = await getValidSessionByTokenQuery(token);
  if (!session) {
    throw new AuthenticationError({
      cause: new Error(`Session ${token} not found`),
      message: `Sessão inválida.`,
      action: `Faça login para continuar.`,
    });
  }
  return session;
}

async function refreshSession(sessionId) {
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  return await refreshSessionExpirationDateQuery(sessionId, expiresAt);
}

async function expireSessionById(sessionId) {
  return await expireSessionByIdQuery(sessionId);
}

async function expireSessionByIdQuery(sessionId) {
  const result = await query({
    text: `
      UPDATE
        sessions
      SET
        expires_at = expires_at - INTERVAL '1 year',
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [sessionId],
  });
  return result.rows[0] ?? null;
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
  return result.rows[0] ?? null;
}

async function getValidSessionByTokenQuery(token) {
  const result = await query({
    text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > NOW()
      LIMIT
        1
    ;`,
    values: [token],
  });
  return result.rows[0] ?? null;
}

async function refreshSessionExpirationDateQuery(sessionId, expiresAt) {
  const result = await query({
    text: `
      UPDATE
        sessions
      SET
        expires_at = $2,
        updated_at = NOW()
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [sessionId, expiresAt],
  });
  return result.rows[0] ?? null;
}
