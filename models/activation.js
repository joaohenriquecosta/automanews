import { sendMail } from "infra/mailer.js";
import { query } from "infra/database.js";
import { randomBytes } from "crypto";
import { getOrigin } from "infra/webserver.js";

const baseUrl = getOrigin();
const ACTIVATION_TOKEN_LIFETIME_MS = 1000 * 60 * 15; // 15 minutes

export { sendActivationEmail };

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
    text: `Olá, ${user.username}! 👋

Para ativar sua conta, clique no link abaixo:
${baseUrl}/cadastro/ativar/${createdToken.token}

Atenciosamente,
Equipe AutomaNews`,
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
