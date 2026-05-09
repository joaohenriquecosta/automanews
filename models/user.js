import { query } from "infra/database.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "infra/errors.js";
import { sendActivationEmail } from "models/activation.js";
import { comparePassword, hashObjectPassword } from "models/password.js";
import { PERMISSIONS, isAuthorized } from "models/authorization.js";

export {
  registerUser,
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUser,
  addFeatures,
  serializePublicUser,
};

/* ── Public API ────────────────────────────────────── */

async function registerUser(userInputValues) {
  let newUser;
  try {
    newUser = await createUser(userInputValues);
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }

    return await handlePendingRegistration(userInputValues, error);
  }

  try {
    await sendActivationEmail(newUser);
  } catch (error) {
    await rollbackUserRegistration(newUser.id);
    throw error;
  }

  return {
    statusCode: 201,
    body: serializePublicUser(newUser),
  };
}

async function rollbackUserRegistration(userId) {
  try {
    await deleteActivationTokensByUserIdQuery(userId);
    await deleteUserByIdQuery(userId);
  } catch (cleanupError) {
    console.error(
      `Failed to roll back registration for user ${userId}`,
      cleanupError,
    );
  }
}

async function createUser(userInputValues) {
  const userInputWithDefaults = {
    ...userInputValues,
    features: PERMISSIONS.default.unactivatedUser,
  };
  await validateUniqueUsername(userInputWithDefaults.username);
  await validateUniqueEmail(userInputWithDefaults.email);
  const secureInput = await hashObjectPassword(userInputWithDefaults);
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

async function getUserByEmail(email) {
  const user = await findUserByEmailQuery(email);
  if (!user) {
    throw new NotFoundError({
      cause: new Error(`User ${email} not found`),
      message: `Usuário ${email} não encontrado.`,
      action: `Verifique se o usuário com email ${email} existe.`,
    });
  }
  return user;
}

async function getUserById(userId) {
  const user = await findUserByIdQuery(userId);
  if (!user) {
    throw new NotFoundError({
      cause: new Error(`User ${userId} not found`),
      message: `Usuário ${userId} não encontrado.`,
      action: `Verifique se o usuário ${userId} existe.`,
    });
  }
  return user;
}

async function updateUser(username, userInputValues, requester) {
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

  if (!isAuthorized(requester, "update:user", currentUser)) {
    throw new ForbiddenError({
      cause: new Error(`User cannot update user ${currentUser.id}`),
      message: "Você não possui permissão para executar esta ação.",
      action:
        'Verifique se o seu usuário possui a feature "update:user" para este recurso.',
    });
  }

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

async function addFeatures(userId, featuresToAdd) {
  if (!Array.isArray(featuresToAdd)) {
    throw new ValidationError({
      message: "Lista de features inválida.",
      action: "Forneça featuresToAdd como um array de strings.",
    });
  }

  if (featuresToAdd.length === 0) {
    return await getUserById(userId);
  }

  return await appendDistinctUserFeaturesByIdQuery(userId, featuresToAdd);
}

async function handlePendingRegistration(userInputValues, originalError) {
  const existingUser = await getExistingUserByUsernameOrThrowOriginalError(
    userInputValues.username,
    originalError,
  );

  if (
    typeof userInputValues.email !== "string" ||
    typeof userInputValues.password !== "string"
  ) {
    throw originalError;
  }

  const hasSameEmail =
    existingUser.email.toLowerCase() === userInputValues.email.toLowerCase();
  const hasSamePassword = await comparePassword(
    userInputValues.password,
    existingUser.password,
  );

  if (!hasSameEmail || !hasSamePassword) {
    throw originalError;
  }

  return await getPendingRegistrationResponse(existingUser);
}

async function getExistingUserByUsernameOrThrowOriginalError(
  username,
  originalError,
) {
  try {
    return await getUserByUsername(username);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw originalError;
    }

    throw error;
  }
}

async function getPendingRegistrationResponse(user) {
  const hasValidActivationToken = await hasValidActivationTokenForUserQuery(
    user.id,
  );

  if (hasValidActivationToken) {
    return {
      statusCode: 200,
      body: {
        message: "Já existe um cadastro pendente para este usuário.",
        action: "Verifique seu email para ativar sua conta.",
      },
    };
  }

  await sendActivationEmail(user);
  return {
    statusCode: 200,
    body: {
      message: "Enviamos um novo email de ativação.",
      action: "Verifique seu email para ativar sua conta.",
    },
  };
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

async function findUserByIdQuery(userId) {
  const result = await query({
    text: `
      SELECT
        *
      FROM
        users
      WHERE
        id = $1
      LIMIT
        1
    ;`,
    values: [userId],
  });
  return result.rows[0] ?? null;
}

async function insertUserQuery(user) {
  const result = await query({
    text: `
      INSERT INTO
        users (username, email, password, features)
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        *
    ;`,
    values: [user.username, user.email, user.password, user.features],
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

async function appendDistinctUserFeaturesByIdQuery(userId, featuresToAdd) {
  const result = await query({
    text: `
      UPDATE
        users
      SET
        features = (
          SELECT
            COALESCE(array_agg(f ORDER BY ord), '{}')
          FROM (
            SELECT DISTINCT ON (f)
              f,
              ord
            FROM
              unnest(
                features || COALESCE($2::varchar[], '{}'::varchar[])
              ) WITH ORDINALITY AS t(f, ord)
            ORDER BY
              f,
              ord
          ) AS deduped
        ),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [userId, featuresToAdd],
  });

  return result.rows[0];
}

async function deleteUserByIdQuery(userId) {
  await query({
    text: `DELETE FROM users WHERE id = $1;`,
    values: [userId],
  });
}

async function deleteActivationTokensByUserIdQuery(userId) {
  await query({
    text: `DELETE FROM user_activation_tokens WHERE user_id = $1;`,
    values: [userId],
  });
}

async function hasValidActivationTokenForUserQuery(userId) {
  const result = await query({
    text: `
      SELECT
        1
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
        AND used_at IS NULL
        AND expires_at > timezone('utc', now())
      LIMIT
        1
    ;`,
    values: [userId],
  });

  return result.rows.length > 0;
}
