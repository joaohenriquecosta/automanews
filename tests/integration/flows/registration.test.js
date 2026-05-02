import {
  waitForAllServices,
  clearDatabase,
  deleteAllEmails,
  postUser,
  postSession,
  patchActivationToken,
  getLastEmail,
  getUser,
  getActivationTokensByUserId,
  getValidActivationTokenByToken,
  expireActivationToken,
  testBaseUrl,
} from "tests/orchestrator";
import { runPendingMigrations } from "models/migrator.js";

const successfulRegistrationUser = {
  username: "SuccessfulRegistrationFlowTest",
  email: "successful.registration.flow@test.com",
  password: "successfulregistrationflowtest",
};

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
  await deleteAllEmails();
});

describe("Use case: Successful registration flow", () => {
  let activatedUser;

  test("Activation email is sent with correct content and activation link", async () => {
    const { response } = await postUser(successfulRegistrationUser);
    expect(response.status).toBe(201);

    const user = await getUser(successfulRegistrationUser.username);

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
    expect(validActivationToken.user_id).toBe(user.id);
    expect(validActivationToken.used_at).toBeNull();
    expect(Date.parse(validActivationToken.expires_at)).toBeGreaterThan(
      Date.now(),
    );
  });

  test("Activation link activates the user account with create:session permission", async () => {
    const activationEmail = await getLastEmail();
    const emailActivationToken = extractActivationToken(activationEmail.text);
    const { response: activationResponse } =
      await patchActivationToken(emailActivationToken);
    expect(activationResponse.status).toBe(200);

    activatedUser = await getUser(successfulRegistrationUser.username);
    expect(activatedUser.features).toEqual(["create:session"]);

    const [usedActivationToken] = await getActivationTokensByUserId(
      activatedUser.id,
    );
    expect(usedActivationToken.token).toBe(emailActivationToken);
    expect(Date.parse(usedActivationToken.used_at)).not.toBeNaN();
  });

  test("Login with activated user account creates a new session", async () => {
    const { response, responseBody } = await postSession({
      email: successfulRegistrationUser.email,
      password: successfulRegistrationUser.password,
    });

    expect(response.status).toBe(201);
    expect(responseBody.user_id).toBe(activatedUser.id);
  });
});

describe("Use case: Expired activation token recovery flow", () => {
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
});

function extractActivationToken(text) {
  const match = text.match(/[a-f0-9]{64}/);
  return match?.[0] ?? null;
}
