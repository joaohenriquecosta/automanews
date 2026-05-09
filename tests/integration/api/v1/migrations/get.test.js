import {
  waitForAllServices,
  clearDatabase,
  testBaseUrl,
  activateUser,
  createDummyUser,
  createSessionForUser,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { addFeatures } from "models/user.js";

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Returns `ForbiddenError`", async () => {
      const response = await fetch(`${testBaseUrl}/api/v1/migrations`);

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
      });
    });
  });
  describe("Standard user", () => {
    test("Returns `ForbiddenError`", async () => {
      const dummyUser = await createDummyUser({
        username: "migrations_get_standard_user",
        email: "migrations.get.standard@test.dev",
      });
      const standardUser = await activateUser(dummyUser.id);
      const session = await createSessionForUser(standardUser.id);

      const response = await fetch(`${testBaseUrl}/api/v1/migrations`, {
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
        action: 'Verifique se o seu usuário possui a feature "read:migration"',
      });
    });
  });
  describe("Privileged user with `read:migration` feature", () => {
    test("Returns empty list when there are no pending migrations", async () => {
      const dummyUser = await createDummyUser({
        username: "migrations_get_privileged_user",
        email: "migrations.get.privileged@test.dev",
      });
      const activatedUser = await activateUser(dummyUser.id);
      const privilegedUser = await addFeatures(activatedUser.id, [
        "read:migration",
      ]);
      const session = await createSessionForUser(privilegedUser.id);

      const response = await fetch(`${testBaseUrl}/api/v1/migrations`, {
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
