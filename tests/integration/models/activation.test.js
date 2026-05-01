import {
  waitForAllServices,
  clearDatabase,
  deleteAllEmails,
  postUser,
  getUser,
  getActivationTokensByUserId,
  expireActivationToken,
} from "tests/orchestrator.js";
import { getValidActivationTokenByToken } from "models/activation.js";
import { runPendingMigrations } from "models/migrator.js";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
  await deleteAllEmails();
});

describe("models/activation", () => {
  describe("getValidActivationTokenByToken", () => {
    test("Throws ValidationError when the token does not exist", async () => {
      await expect(
        getValidActivationTokenByToken("non-existent-activation-token"),
      ).rejects.toMatchObject({
        name: "ValidationError",
        statusCode: 400,
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação.",
      });
    });

    test("Throws ValidationError when the token is expired", async () => {
      const userInput = {
        username: "ExpiredActivationValidationTest",
        email: "expired.activation.validation@test.com",
        password: "expiredactivationvalidationtest",
      };
      const { response } = await postUser(userInput);
      expect(response.status).toBe(201);

      const user = await getUser(userInput.username);
      const [activationToken] = await getActivationTokensByUserId(user.id);
      const expiredToken = await expireActivationToken(activationToken.id);

      await expect(
        getValidActivationTokenByToken(expiredToken.token),
      ).rejects.toMatchObject({
        name: "ValidationError",
        statusCode: 400,
        message: "Token de ativação inválido ou expirado.",
        action: "Solicite um novo email de ativação.",
      });
    });
  });
});
