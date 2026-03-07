import db from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";

async function createUser(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  const newUser = await runInsertUserQuery(userInputValues);
  return newUser;

  async function validateUniqueUsername(username) {
    const result = await db.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        ;`,
      values: [username],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: `O username '${username}' já está em uso.`,
        action:
          "Forneça um username novo ou faça login com o username já existente.",
      });
    }
  }

  async function validateUniqueEmail(email) {
    const result = await db.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        ;`,
      values: [email],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: `O email '${email}' já está em uso.`,
        action: "Forneça um email novo ou faça login com o email já existente.",
      });
    }
  }

  async function runInsertUserQuery(user) {
    const result = await db.query({
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
}

async function getUserByUsername(username) {
  const foundUser = await runSelectUserQuery(username);
  if (!foundUser) {
    throw new NotFoundError({
      cause: new Error(`User ${username} not found`),
      message: `Usuário ${username} não encontrado.`,
      action: `Verifique se o usuário ${username} existe.`,
    });
  }
  return foundUser;

  async function runSelectUserQuery(username) {
    const result = await db.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT 1
        ;`,
      values: [username],
    });
    return result.rows[0] ?? null;
  }
}

export { createUser, getUserByUsername };
