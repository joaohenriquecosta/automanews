import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { validate as uuidValidate, version as uuidVersion } from "uuid";

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Existing user", () => {
    let dummyUser;

    beforeAll(async () => {
      dummyUser = await createDummyUser();
    });

    describe("With exact case match", () => {
      test("'dummy_user' is retrieved successfully and returned the correct data", async () => {
        const { username } = dummyUser;

        const response = await fetch(
          `http://localhost:3000/api/v1/users/${username}`,
        );

        const responseBody = await response.json();

        expect(response.status).toBe(200);

        expect(uuidValidate(responseBody.id)).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(responseBody).toEqual(dummyUser);
      });
    });
    describe("With case mismatch", () => {
      test("'DUMMY_USER' is retrieved successfully and returned the correct data", async () => {
        const uppercaseUsername = dummyUser.username.toUpperCase();
        const response = await fetch(
          `http://localhost:3000/api/v1/users/${uppercaseUsername}`,
        );

        const responseBody = await response.json();

        expect(response.status).toBe(200);

        expect(uuidValidate(responseBody.id)).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(responseBody).toEqual(dummyUser);
      });
    });
    describe("With non-existent username", () => {
      test("'non_existent_user' returns 404 Not Found", async () => {
        const nonExistentUsername = "non_existent_user";
        const response = await fetch(
          `http://localhost:3000/api/v1/users/${nonExistentUsername}`,
        );

        expect(response.status).toBe(404);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          name: "NotFoundError",
          status_code: 404,
          message: `Usuário ${nonExistentUsername} não encontrado.`,
          action: `Verifique se o usuário ${nonExistentUsername} existe.`,
        });
      });
    });
  });
});
