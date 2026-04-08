import { waitForAllServices, testBaseUrl } from "tests/orchestrator.js";

// Parse numeric values to match the API's integer output
const expectedDbVersion = process.env.POSTGRES_VERSION;
const expectedMaxConnections = parseInt(process.env.POSTGRES_MAX_CONNECTIONS);
const expectedOpenedConnections = 1;

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    let response;
    let responseBody;

    // Fetches data once before running the individual test assertions
    beforeAll(async () => {
      await waitForAllServices();
      response = await fetch(`${testBaseUrl}/api/v1/status`);
      responseBody = await response.json();
    });

    test("Retrieving current server status", () => {
      // Verifies the HTTP status code
      expect(response.status).toBe(200);

      // Validates that 'updated_at' is present and is a valid ISO string
      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
    });

    test("Retrieving database dependency information", () => {
      // Verifies the integrity of the 'db' metadata using top-level constants
      expect(responseBody.dependencies.db.version).toEqual(expectedDbVersion);
      expect(responseBody.dependencies.db.max_connections).toEqual(
        expectedMaxConnections,
      );
      expect(responseBody.dependencies.db.opened_connections).toEqual(
        expectedOpenedConnections,
      );
    });
  });
});
