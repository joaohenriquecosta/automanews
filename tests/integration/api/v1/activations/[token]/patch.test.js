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

describe("PATCH /api/v1/activations/[token]", () => {
  describe("Anonymous user", () => {
    test("Activates the user when the token is valid", async () => {
      const userInput = {
        username: "valid_activation_patch",
        email: "valid.activation.patch@test.dev",
        password: "valid_activation_patch_password",
      };
      const { response: userResponse } = await postUser(userInput);
      expect(userResponse.status).toBe(201);

      const user = await getUser(userInput.username);
      const [activationToken] = await getActivationTokensByUserId(user.id);

      const { response, responseBody } = await patchActivationToken(
        activationToken.token,
      );

      expect(response.status).toBe(200);
      expect(uuidValidate(responseBody.used_activation_token.id)).toBe(true);
      expect(uuidVersion(responseBody.used_activation_token.id)).toBe(4);
      expect(responseBody.used_activation_token.token).toBe(
        activationToken.token,
      );
      expect(responseBody.used_activation_token.user_id).toBe(user.id);
      expect(
        Date.parse(responseBody.used_activation_token.used_at),
      ).not.toBeNaN();
      expect(responseBody.user).toBeUndefined();

      const currentTokenStatus = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(currentTokenStatus).toBeNull();

      const activatedUser = await getUser(userInput.username);
      expect(activatedUser.features).toEqual(DEFAULT_ACTIVATED_USER_FEATURES);

      const [usedActivationToken] = await getActivationTokensByUserId(user.id);
      expect(usedActivationToken.token).toBe(activationToken.token);
      expect(usedActivationToken.user_id).toBe(user.id);
      expect(Date.parse(usedActivationToken.used_at)).not.toBeNaN();
    });

    test("Returns ValidationError when the token does not exist", async () => {
      const { response, responseBody } = await patchActivationToken(
        "non-existent-activation-token",
      );

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        name: "ValidationError",
        status_code: 400,
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação.",
      });
    });

    test("Returns ValidationError when the token is expired", async () => {
      const userInput = {
        username: "expired_activation_patch",
        email: "expired.activation.patch@test.dev",
        password: "expired_activation_patch_password",
      };
      const { response: userResponse } = await postUser(userInput);
      expect(userResponse.status).toBe(201);

      const user = await getUser(userInput.username);
      const [activationToken] = await getActivationTokensByUserId(user.id);
      const expiredToken = await expireActivationToken(activationToken.id);

      const { response, responseBody } = await patchActivationToken(
        expiredToken.token,
      );

      expect(response.status).toBe(400);
      expect(responseBody).toMatchObject({
        name: "ValidationError",
        status_code: 400,
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação.",
      });
    });

    test("Returns ForbiddenError when the target user cannot read activation tokens", async () => {
      const targetUserInput = {
        username: "target_without_read_token",
        email: "target.without.read.token@test.dev",
        password: "target_without_read_token_password",
      };
      const { response: targetUserResponse } = await postUser(targetUserInput);
      expect(targetUserResponse.status).toBe(201);

      const targetUser = await getUser(targetUserInput.username);
      const [activationToken] = await getActivationTokensByUserId(
        targetUser.id,
      );
      await activateUser(targetUser.id);

      const { response, responseBody } = await patchActivationToken(
        activationToken.token,
      );

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para usar este token de ativação.",
        action: "Entre em contato com o suporte.",
      });

      const validActivationToken = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(validActivationToken.id).toBe(activationToken.id);
    });
  });

  describe("Standard user", () => {
    test("Returns ForbiddenError when the requester cannot read activation tokens", async () => {
      const targetUserInput = {
        username: "activation_target",
        email: "activation.target@test.dev",
        password: "activation_target_password",
      };
      const { response: targetUserResponse } = await postUser(targetUserInput);
      expect(targetUserResponse.status).toBe(201);

      const targetUser = await getUser(targetUserInput.username);
      const [activationToken] = await getActivationTokensByUserId(
        targetUser.id,
      );

      const currentUser = await createDummyUser({
        username: "no_activation_token_read",
        email: "activated.user.without.activation.token.read@test.dev",
        password: "password",
      });
      await activateUser(currentUser.id);
      const session = await createSessionForUser(currentUser.id);

      const response = await fetch(
        `${testBaseUrl}/api/v1/activations/${activationToken.token}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      );
      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action:
          "Verifique se o seu usuário possui a feature read:activation_token.",
      });

      const validActivationToken = await getValidActivationTokenByToken(
        activationToken.token,
      );
      expect(validActivationToken.id).toBe(activationToken.id);
    });
  });
});
