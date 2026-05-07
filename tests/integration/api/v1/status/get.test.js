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

const expectedDbVersion = process.env.POSTGRES_VERSION;
const expectedMaxConnections = parseInt(process.env.POSTGRES_MAX_CONNECTIONS);

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

async function getStatus(sessionToken) {
  const response = await fetch(`${testBaseUrl}/api/v1/status`, {
    headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : {},
  });
  const responseBody = await response.json();
  return { response, responseBody };
}

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Returns status without database version", async () => {
      const { response, responseBody } = await getStatus();

      expect(response.status).toBe(200);
      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.db.max_connections).toEqual(
        expectedMaxConnections,
      );
      expect(
        responseBody.dependencies.db.opened_connections,
      ).toBeGreaterThanOrEqual(1);
      expect(responseBody.dependencies.db.version).toBeUndefined();
    });
  });

  describe("Standard user", () => {
    test("Returns status without database version", async () => {
      const dummyUser = await createDummyUser({
        username: "status_get_standard_user",
        email: "status.get.standard@test.dev",
      });
      const standardUser = await activateUser(dummyUser.id);
      const session = await createSessionForUser(standardUser.id);

      const { response, responseBody } = await getStatus(session.token);

      expect(response.status).toBe(200);
      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.db.max_connections).toEqual(
        expectedMaxConnections,
      );
      expect(
        responseBody.dependencies.db.opened_connections,
      ).toBeGreaterThanOrEqual(1);
      expect(responseBody.dependencies.db.version).toBeUndefined();
    });
  });

  describe('Privileged user with "read:status:all" feature', () => {
    test('Returns database version when user has "read:status:all" feature', async () => {
      const dummyUser = await createDummyUser({
        username: "status_get_priv_all_user",
        email: "status.get.priv.all@test.dev",
      });
      const activatedUser = await activateUser(dummyUser.id);
      const privilegedUser = await addFeatures(activatedUser.id, [
        "read:status",
        "read:status:all",
      ]);
      const session = await createSessionForUser(privilegedUser.id);

      const { response, responseBody } = await getStatus(session.token);

      expect(response.status).toBe(200);
      expect(responseBody.dependencies.db.version).toEqual(expectedDbVersion);
      expect(responseBody.dependencies.db.max_connections).toEqual(
        expectedMaxConnections,
      );
      expect(
        responseBody.dependencies.db.opened_connections,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
