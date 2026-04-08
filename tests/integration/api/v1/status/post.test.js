import { waitForAllServices, testBaseUrl } from "tests/orchestrator.js";

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    let response;

    // Fetches data once before running the individual test assertions
    beforeAll(async () => {
      await waitForAllServices();
      response = await fetch(`${testBaseUrl}/api/v1/status`, {
        method: "POST",
      });
    });

    test("Retrieving current server status", async () => {
      // Verifies the HTTP status code
      expect(response.status).toBe(405);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "MethodNotAllowedError",
        status_code: 405,
        message: "Método não permitido.",
        action: "Use um método HTTP válido para o endpoint.",
      });
    });
  });
});
