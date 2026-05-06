import {
  waitForAllServices,
  clearDatabase,
  testBaseUrl,
  createDummyUser,
  activateUser,
  createSessionForUser,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { addFeatures } from "models/user.js";

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Returns ForbiddenError", async () => {
      const response = await fetch(`${testBaseUrl}/api/v1/migrations`, {
        method: "POST",
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "create:migration"',
      });
    });
  });

  describe("Standard user", () => {
    test("Returns ForbiddenError", async () => {
      const dummyUser = await createDummyUser({
        username: "migrations_post_standard_user",
        email: "migrations.post.standard@test.dev",
      });
      const standardUser = await activateUser(dummyUser.id);
      const session = await createSessionForUser(standardUser.id);
      const response = await fetch(`${testBaseUrl}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "create:migration"',
      });
    });
  });

  describe('Privileged user with "create:migration" feature', () => {
    test("Returns 200 when migrations are applied", async () => {
      const dummyUser = await createDummyUser({
        username: "migrations_post_priv_user",
        email: "migrations.post.priv@test.dev",
      });
      const activatedUser = await activateUser(dummyUser.id);
      const privilegedUser = await addFeatures(activatedUser.id, [
        "create:migration",
      ]);
      const session = await createSessionForUser(privilegedUser.id);
      const response = await fetch(`${testBaseUrl}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBe(0);
    });
  });
});
