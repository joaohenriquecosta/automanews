/*
 * INTEGRATION TEST: Status Endpoint
 * Verifies the Controller's ability to orchestrate data from the Infrastructure Layer.
 * In MVC, this ensures the View contract remains consistent.
 */

// Note: Parse numeric values to match the API's integer output
const expectedDbVersion = process.env.POSTGRES_VERSION;
const expectedMaxConnections = parseInt(process.env.POSTGRES_MAX_CONNECTIONS);
const expectedOpenedConnections = 0;

describe("GET /api/v1/status", () => {
  let response;
  let responseBody;

  // Fetches data once before running the individual test assertions
  beforeAll(async () => {
    response = await fetch("http://localhost:3000/api/v1/status");
    responseBody = await response.json();
  });

  test("Retrieving current system status", () => {
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
