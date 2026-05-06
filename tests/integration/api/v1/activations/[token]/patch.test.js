import {
  waitForAllServices,
  clearDatabase,
  postUser,
  getUser,
  createDummyUser,
  activateUser,
  createSessionForUser,
  getActivationTokensByUserId,
  expireActivationToken,
  patchActivationToken,
  getValidActivationTokenByToken,
  testBaseUrl,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { DEFAULT_ACTIVATED_USER_FEATURES } from "models/authorization.js";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
});

async function createActivationTokenForUser(userInput) {
  const { response: userResponse } = await postUser(userInput);
  expect(userResponse.status).toBe(201);

  const user = await getUser(userInput.username);
  const [activationToken] = await getActivationTokensByUserId(user.id);

  return {
    user,
    activationToken,
  };
}

async function patchActivationTokenWithSession(token, sessionToken) {
  const response = await fetch(`${testBaseUrl}/api/v1/activations/${token}`, {
    method: "PATCH",
    headers: {
      Cookie: `session_id=${sessionToken}`,
    },
  });

  const responseBody = await response.json();

  return {
    response,
    responseBody,
  };
}

function expectInvalidActivationToken(response, responseBody) {
  expect(response.status).toBe(400);
  expect(responseBody).toMatchObject({
    name: "ValidationError",
    status_code: 400,
    message: "Token de ativação inválido ou expirado.",
    action: "Solicite um novo email de ativação.",
  });
}

function expectRequesterForbidden(response, responseBody) {
  expect(response.status).toBe(403);
  expect(responseBody).toEqual({
    name: "ForbiddenError",
    status_code: 403,
    message: "Você não possui permissão para executar esta ação.",
    action:
      'Verifique se o seu usuário possui a feature "read:activation_token"',
  });
}

function expectTargetUserForbidden(response, responseBody) {
  expect(response.status).toBe(403);
  expect(responseBody).toEqual({
    name: "ForbiddenError",
    status_code: 403,
    message: "Você não possui permissão para usar este token de ativação.",
    action: "Entre em contato com o suporte.",
  });
}

describe("PATCH /api/v1/activations/[token]", () => {
  describe("Anonymous user", () => {
    test("Activates the user when the token is valid", async () => {
      const { user, activationToken } = await createActivationTokenForUser({
        username: "valid_activation_patch",
        email: "valid.activation.patch@test.dev",
        password: "valid_activation_patch_password",
      });

      const { response, responseBody } = await patchActivationToken(
        activationToken.token,
      );

      expect(response.status).toBe(200);
      expect(uuidValidate(responseBody.id)).toBe(true);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.token).toBe(activationToken.token);
      expect(responseBody.user_id).toBe(user.id);
      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(responseBody.user).toBeUndefined();

      const currentTokenStatus = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(currentTokenStatus).toBeNull();

      const activatedUser = await getUser(user.username);
      expect(activatedUser.features).toEqual(DEFAULT_ACTIVATED_USER_FEATURES);

      const [usedActivationToken] = await getActivationTokensByUserId(user.id);
      expect(usedActivationToken.token).toBe(activationToken.token);
      expect(usedActivationToken.user_id).toBe(user.id);
      expect(Date.parse(usedActivationToken.used_at)).not.toBeNaN();
    });

    test("Returns ValidationError when the token does not exist", async () => {
      expect.assertions(2);
      const { response, responseBody } = await patchActivationToken(
        "non-existent-activation-token",
      );

      expectInvalidActivationToken(response, responseBody);
    });

    test("Returns ValidationError when the token is expired", async () => {
      expect.assertions(3);
      const { activationToken } = await createActivationTokenForUser({
        username: "expired_activation_patch",
        email: "expired.activation.patch@test.dev",
        password: "expired_activation_patch_password",
      });
      const expiredToken = await expireActivationToken(activationToken.id);

      const { response, responseBody } = await patchActivationToken(
        expiredToken.token,
      );

      expectInvalidActivationToken(response, responseBody);
    });

    test("Returns ForbiddenError when the target user cannot read activation tokens", async () => {
      const { user: targetUser, activationToken } =
        await createActivationTokenForUser({
          username: "target_without_read_token",
          email: "target.without.read.token@test.dev",
          password: "target_without_read_token_password",
        });
      await activateUser(targetUser.id);

      const { response, responseBody } = await patchActivationToken(
        activationToken.token,
      );

      expectTargetUserForbidden(response, responseBody);

      const validActivationToken = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(validActivationToken.id).toBe(activationToken.id);
    });
  });

  describe("Standard user", () => {
    let session;

    beforeEach(async () => {
      const currentUser = await createDummyUser({
        username: "no_activation_token_read",
        email: "activated.user.without.activation.token.read@test.dev",
        password: "password",
      });
      await activateUser(currentUser.id);
      session = await createSessionForUser(currentUser.id);
    });

    test.each([
      {
        testName: "valid token",
        getToken: async () => {
          const { activationToken } = await createActivationTokenForUser({
            username: "activation_target",
            email: "activation.target@test.dev",
            password: "activation_target_password",
          });
          return activationToken;
        },
      },
      {
        testName: "expired token",
        getToken: async () => {
          const { activationToken } = await createActivationTokenForUser({
            username: "expired_activation_target",
            email: "expired.activation.target@test.dev",
            password: "expired_activation_target_password",
          });
          return await expireActivationToken(activationToken.id);
        },
      },
      {
        testName: "non-existent token",
        getToken: async () => ({
          token: "non-existent-activation-token",
        }),
      },
    ])("Returns ForbiddenError with $testName", async ({ getToken }) => {
      const activationToken = await getToken();

      const { response, responseBody } = await patchActivationTokenWithSession(
        activationToken.token,
        session.token,
      );

      expect(response.status).toBe(403);
      expectRequesterForbidden(response, responseBody);
    });

    test("Does not use the token when the requester cannot read activation tokens", async () => {
      const { activationToken } = await createActivationTokenForUser({
        username: "target_without_read_token",
        email: "target.without.read.token@test.dev",
        password: "target_without_read_token_password",
      });

      const { response, responseBody } = await patchActivationTokenWithSession(
        activationToken.token,
        session.token,
      );

      expectRequesterForbidden(response, responseBody);

      const validActivationToken = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(validActivationToken.id).toBe(activationToken.id);
    });
  });
});
