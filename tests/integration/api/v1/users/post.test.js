import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator";
import { validate as uuidValidate, version as uuidVersion } from "uuid";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
});

async function postUser(userInput) {
  const response = await fetch("http://localhost:3000/api/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userInput),
  });

  const responseBody = await response.json();

  return {
    response,
    responseBody,
  };
}

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    describe("With unique and valid data", () => {
      test("The user is created successfully and returned the correct data", async () => {
        const userInput = {
          username: "valid_user",
          email: "valid_email@test.dev",
          password: "valid_password",
        };
        const { response, responseBody } = await postUser(userInput);

        expect(response.status).toBe(201);
        expect(responseBody).toEqual({
          id: responseBody.id,
          username: userInput.username,
          email: userInput.email,
          password: responseBody.password,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });

        expect(uuidValidate(responseBody.id)).toBe(true);
        expect(uuidVersion(responseBody.id)).toBe(4);
        expect(Date.parse(responseBody.created_at)).not.toBeNaN();
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      });
    });
    describe("With duplicated field", () => {
      test.each([
        {
          testName: "email",
          existingUser: {
            username: "duplicated_email_1",
            email: "duplicated_email@test.dev",
            password: "duplicated_email_password_1",
          },
          newUser: {
            username: "duplicated_email_2",
            email: "DUPLICATED_EMAIL@TEST.DEV",
            password: "duplicated_email_password_2",
          },
          expectedError: {
            name: "ValidationError",
            status_code: 400,
            message: "O email 'DUPLICATED_EMAIL@TEST.DEV' já está em uso.",
            action:
              "Forneça um email novo ou faça login com o email já existente.",
          },
        },
        {
          testName: "username",
          existingUser: {
            username: "duplicated_username",
            email: "duplicated_username1@test.dev",
            password: "duplicated_username_password_1",
          },
          newUser: {
            username: "DUPLICATED_USERNAME",
            email: "duplicated_username2@test.dev",
            password: "duplicated_username_password_2",
          },
          expectedError: {
            name: "ValidationError",
            status_code: 400,
            message: "O username 'DUPLICATED_USERNAME' já está em uso.",
            action:
              "Forneça um username novo ou faça login com o username já existente.",
          },
        },
      ])(
        "The user is not created when the $testName is duplicated",
        async ({ existingUser, newUser, expectedError }) => {
          await createDummyUser(existingUser);

          const { response, responseBody } = await postUser(newUser);

          expect(response.status).toBe(400);
          expect(responseBody).toEqual(expectedError);
        },
      );
    });
  });
});
