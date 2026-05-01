import {
  waitForAllServices,
  clearDatabase,
  postUser,
  getUser,
  getActivationTokensByUserId,
  expireActivationToken,
  patchActivationToken,
  getValidActivationTokenByToken,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { validate as uuidValidate, version as uuidVersion } from "uuid";

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
      expect(activatedUser.features).toEqual(["create:session"]);

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
  });
});
