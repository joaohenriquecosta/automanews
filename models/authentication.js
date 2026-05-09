import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "infra/errors.js";
import { comparePassword, getAuthDummyPasswordHash } from "models/password.js";
import { getUserByEmail } from "models/user.js";

export { getUser };

async function getUser(providedEmail, providedPassword) {
  if (
    typeof providedEmail !== "string" ||
    typeof providedPassword !== "string" ||
    !providedEmail.trim() ||
    !providedPassword
  ) {
    throw new ValidationError({
      message: "Email e senha são obrigatórios.",
      action: "Forneça um email e uma senha válidos.",
    });
  }

  const email = providedEmail.trim();

  try {
    const storedUser = await getUserByEmail(email);
    const passwordHash = storedUser.password;
    const isPasswordValid = await comparePassword(
      providedPassword,
      passwordHash,
    );
    if (!isPasswordValid) {
      throw authenticationFailure("auth_invalid_password");
    }
    return storedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      await getAuthDummyPasswordHash();
      throw authenticationFailure("auth_email_not_found");
    }
    throw error;
  }
}

function authenticationFailure(causeMessage) {
  return new AuthenticationError({
    cause: new Error(causeMessage),
    message: "Email ou senha inválidos.",
    action: "Verifique se o email e a senha fornecidos são válidos.",
  });
}
