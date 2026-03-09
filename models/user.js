import { query } from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";
import { hashObjectPassword } from "models/password";

export { createUser, getUserByUsername };

/* ── Public API ────────────────────────────────────── */

async function createUser(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  const secureInput = await hashObjectPassword(userInputValues);
  return await insertUserQuery(secureInput);
}

async function getUserByUsername(username) {
  const user = await findUserByUsernameQuery(username);
  if (!user) {
    throw new NotFoundError({
      cause: new Error(`User ${username} not found`),
      message: `Usuário ${username} não encontrado.`,
      action: `Verifique se o usuário ${username} existe.`,
    });
  }
  return user;
}

/* ── Validation ────────────────────────────────────── */

async function validateUniqueUsername(username) {
  const existingUser = await findUserByUsernameQuery(username);
  if (existingUser) {
    throw new ValidationError({
      message: `O username '${username}' já está em uso.`,
      action:
        "Forneça um username novo ou faça login com o username já existente.",
    });
  }
}

async function validateUniqueEmail(email) {
  const existingUser = await findUserByEmailQuery(email);
  if (existingUser) {
    throw new ValidationError({
      message: `O email '${email}' já está em uso.`,
      action: "Forneça um email novo ou faça login com o email já existente.",
    });
  }
}

/* ── Queries ───────────────────────────────────────── */

async function findUserByUsernameQuery(username) {
  const result = await query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
    ;`,
    values: [username],
  });
  return result.rows[0] ?? null;
}

async function findUserByEmailQuery(email) {
  const result = await query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT
        1
    ;`,
    values: [email],
  });
  return result.rows[0] ?? null;
}

async function insertUserQuery(user) {
  const result = await query({
    text: `
      INSERT INTO
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [user.username, user.email, user.password],
  });
  return result.rows[0];
}
