import {
  waitForAllServices,
  clearDatabase,
  deleteAllEmails,
  postUser,
  getLastEmail,
  getUser,
  getActivationTokensByUserId,
  expireActivationToken,
  testBaseUrl,
} from "tests/orchestrator";
import { runPendingMigrations } from "models/migrator.js";
import { getValidActivationTokenByToken } from "models/activation.js";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
  await deleteAllEmails();
});

describe("Use case: Successful registration flow", () => {
  test("Activation email is sent with correct content and activation link", async () => {
    const userInput = {
      username: "ActivationEmailTest",
      email: "activation.email@test.com",
      password: "activationemailtest",
    };
    const { response } = await postUser(userInput);
    expect(response.status).toBe(201);

    const user = await getUser(userInput.username);

    const activationTokens = await getActivationTokensByUserId(user.id);
    expect(activationTokens.length).toBe(1);
    const activationTokenFromUser = activationTokens[0];

    const lastEmail = await getLastEmail();
    expect(lastEmail.sender).toBe("<contato@automanews.com.br>");
    expect(lastEmail.recipients[0]).toBe(`<${user.email}>`);
    expect(lastEmail.subject).toBe("Ative a sua conta no AutomaNews!");
    expect(lastEmail.text).toContain(`${user.username}`);
    expect(lastEmail.text).toContain(
      `${testBaseUrl}/cadastro/ativar/${activationTokenFromUser.token}`,
    );

    const emailActivationToken = extractActivationToken(lastEmail.text);
    expect(emailActivationToken).not.toBeNull();
    expect(emailActivationToken).toBe(activationTokenFromUser.token);

    const validActivationToken =
      await getValidActivationTokenByToken(emailActivationToken);
    expect(validActivationToken).not.toBeNull();
    expect(validActivationToken.user_id).toBe(user.id);
    expect(validActivationToken.used_at).toBeNull();
    expect(Date.parse(validActivationToken.expires_at)).toBeGreaterThan(
      Date.now(),
    );
  });

  test("Expired activation token resend email includes the new activation link", async () => {
    const userInput = {
      username: "ExpiredActivationTokenTest",
      email: "expired.activation.token@test.com",
      password: "expiredactivationtokentest",
    };
    const { response: firstResponse } = await postUser(userInput);
    expect(firstResponse.status).toBe(201);

    const user = await getUser(userInput.username);
    const activationTokens = await getActivationTokensByUserId(user.id);
    const expiredToken = activationTokens[0];
    const updatedExpiredToken = await expireActivationToken(expiredToken.id);
    expect(Date.parse(updatedExpiredToken.expires_at)).toBeLessThan(Date.now());
    await deleteAllEmails();

    const { response } = await postUser(userInput);

    expect(response.status).toBe(200);

    const updatedActivationTokens = await getActivationTokensByUserId(user.id);
    const newActivationToken = updatedActivationTokens[0];
    expect(newActivationToken.id).not.toBe(expiredToken.id);

    const lastEmail = await getLastEmail();
    expect(lastEmail.recipients[0]).toBe(`<${user.email}>`);
    const emailActivationToken = extractActivationToken(lastEmail.text);
    const validActivationToken =
      await getValidActivationTokenByToken(emailActivationToken);
    expect(validActivationToken.id).toBe(newActivationToken.id);
  });

  // The activation link activates the user account with the base permissions

  // Login with user account should create a new session
});

function extractActivationToken(text) {
  const match = text.match(/[a-f0-9]{64}/);
  return match?.[0] ?? null;
}
