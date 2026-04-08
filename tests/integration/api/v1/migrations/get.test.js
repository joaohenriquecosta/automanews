import {
  waitForAllServices,
  clearDatabase,
  testBaseUrl,
} from "tests/orchestrator.js";

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    beforeAll(async () => {
      await waitForAllServices();
      await clearDatabase();
    });
    test("Check migrations contents", async () => {
      const response = await fetch(`${testBaseUrl}/api/v1/migrations`);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody.length).toBeGreaterThan(0);
    });
  });
});
