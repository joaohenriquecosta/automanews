import { query } from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
import { hashObjectPassword } from "models/password";

export { createUser, getUserByUsername, updateUser, serializePublicUser };

/* ── Public API ────────────────────────────────────── */

async function createUser(userInputValues) {
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  const secureInput = await hashObjectPassword(userInputValues);
  return await insertUserQuery(secureInput);
}

function serializePublicUser(databaseUser) {
  const publicUser = { ...databaseUser };
  delete publicUser.password;
  return publicUser;
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

async function updateUser(username, userInputValues) {
  const allowedFields = ["username", "email", "password"];

  if (Object.keys(userInputValues).length === 0) {
    throw new ValidationError({
      message: "Nenhum campo foi enviado para atualização do usuário.",
      action: `Envie pelo menos um dos campos permitidos para atualização: ${allowedFields.join(", ")}.`,
    });
  }

  for (const inputField of Object.keys(userInputValues)) {
    if (!allowedFields.includes(inputField)) {
      throw new ValidationError({
        message: `O campo ${inputField} não é permitido para atualização do usuário.`,
        action: `Envie somente campos permitidos para atualização: ${allowedFields.join(", ")}.`,
      });
    }
  }

  const currentUser = await getUserByUsername(username);

  if (
    "username" in userInputValues &&
    username.toLowerCase() !== userInputValues.username.toLowerCase()
  ) {
    await validateUniqueUsername(userInputValues.username);
  }

  if (
    "email" in userInputValues &&
    currentUser.email.toLowerCase() !== userInputValues.email.toLowerCase()
  ) {
    await validateUniqueEmail(userInputValues.email);
  }

  const fieldsToUpdate =
    "password" in userInputValues
      ? await hashObjectPassword(userInputValues)
      : userInputValues;

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (field in fieldsToUpdate) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(fieldsToUpdate[field]);
      paramIndex++;
    }
  }

  return await updateUserQuery(username, setClauses.join(", "), values);
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

async function updateUserQuery(username, setClauses, values) {
  const result = await query({
    text: `
      UPDATE
        users
      SET
        ${setClauses},
        updated_at = timezone('utc', now())
      WHERE
        LOWER(username) = LOWER($${values.length + 1})
      RETURNING
        *
    ;`,
    values: [...values, username],
  });
  return result.rows[0];
}
