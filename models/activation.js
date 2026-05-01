import { sendMail } from "infra/mailer.js";
import { query } from "infra/database.js";
import { randomBytes } from "crypto";
import { getOrigin } from "infra/webserver.js";
import { ValidationError } from "infra/errors.js";

const baseUrl = getOrigin();
const ACTIVATION_TOKEN_LIFETIME_MS = 1000 * 60 * 15; // 15 minutes
const activatedUserDefaultFeatures = ["create:session"];

export { sendActivationEmail, activateUserByToken };

async function sendActivationEmail(user) {
  const activationTokenValue = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_LIFETIME_MS);
  const createdToken = await createActivationTokenQuery(
    user.id,
    expiresAt,
    activationTokenValue,
  );
  await sendMail({
    from: "<contato@automanews.com.br>",
    to: `<${user.email}>`,
    subject: "Ative a sua conta no AutomaNews!",
    text: createActivationEmailText(user, createdToken),
  });
}

function createActivationEmailText(user, activationToken) {
  return [
    `Olá, ${user.username}! 👋`,
    "",
    "Para ativar sua conta, clique no link abaixo:",
    `${baseUrl}/cadastro/ativar/${activationToken.token}`,
    "",
    "Atenciosamente,",
    "Equipe AutomaNews",
  ].join("\n");
}

async function getValidActivationTokenByToken(token) {
  const activationToken = await getValidActivationTokenByTokenQuery(token);

  if (!activationToken) {
    throw invalidActivationTokenError(token);
  }

  return activationToken;
}

async function markActivationTokenAsUsed(activationTokenId) {
  return await markActivationTokenAsUsedQuery(activationTokenId);
}

async function activateUserByToken(token) {
  const activationToken = await getValidActivationTokenByToken(token);
  const usedActivationToken = await markActivationTokenAsUsed(
    activationToken.id,
  );
  await activateUserById(activationToken.user_id);

  return usedActivationToken;
}

async function activateUserById(userId) {
  return await updateUserFeaturesByIdQuery(
    userId,
    activatedUserDefaultFeatures,
  );
}

function invalidActivationTokenError(token) {
  return new ValidationError({
    cause: new Error(`Activation token ${token} not found or invalid`),
    message: "Token de ativação inválido ou expirado.",
    action: "Solicite um novo email de ativação.",
  });
}

async function createActivationTokenQuery(userId, expiresAt, token) {
  const result = await query({
    text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at, token)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [userId, expiresAt, token],
  });

  return result.rows[0] ?? null;
}

async function markActivationTokenAsUsedQuery(activationTokenId) {
  const result = await query({
    text: `
      UPDATE
        user_activation_tokens
      SET
        used_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [activationTokenId],
  });

  return result.rows[0] ?? null;
}

async function getValidActivationTokenByTokenQuery(token) {
  const result = await query({
    text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        token = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT
        1
    ;`,
    values: [token],
  });

  return result.rows[0] ?? null;
}

async function updateUserFeaturesByIdQuery(userId, features) {
  const result = await query({
    text: `
      UPDATE
        users
      SET
        features = $2,
        updated_at = timezone('utc', now())
      WHERE
        id = $1
      RETURNING
        *
    ;`,
    values: [userId, features],
  });

  return result.rows[0] ?? null;
}
