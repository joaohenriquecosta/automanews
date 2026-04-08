import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  getUser,
  testBaseUrl,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { comparePassword } from "models/password";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
});

async function patchUser(username, userInputValues) {
  const response = await fetch(`${testBaseUrl}/api/v1/users/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userInputValues),
  });

  const responseBody = await response.json();

  return {
    response,
    responseBody,
  };
}

describe("PATCH /api/v1/users/[username]", () => {
  describe("Existing user", () => {
    let dummyUser, username;

    beforeEach(async () => {
      dummyUser = await createDummyUser();
      username = dummyUser.username;
    });

    describe("With valid data", () => {
      test("The user is updated successfully and returns updated user data", async () => {
        const validUserInputValues = {
          username: "patched_new_username",
          email: "patched_new_email@test.dev",
          password: "patched_new_password",
        };

        const { response, responseBody } = await patchUser(
          username,
          validUserInputValues,
        );

        expect(response.status).toBe(200);
        expect(responseBody.updated_at > dummyUser.updated_at).toBe(true);
        expect(responseBody.updated_at > responseBody.created_at).toBe(true);

        const userInDatabase = await getUser(validUserInputValues.username);

        expect(responseBody).toEqual({
          id: userInDatabase.id,
          username: validUserInputValues.username,
          email: validUserInputValues.email,
          created_at: userInDatabase.created_at,
          updated_at: userInDatabase.updated_at,
        });
        expect(responseBody.password).toBeUndefined();
      });

      test("The updated password is hashed and valid", async () => {
        const validUserInputValues = {
          username: "patched_new_username",
          email: "patched_new_email@test.dev",
          password: "patched_new_password",
        };

        // First, patch the user
        await patchUser(username, validUserInputValues);

        const userInDatabase = await getUser(validUserInputValues.username);

        // Confirm the hash matches the new raw password
        const isStoredHashValid = await comparePassword(
          validUserInputValues.password,
          userInDatabase.password,
        );
        expect(isStoredHashValid).toBe(true);
      });
    });

    describe("With empty userInputValues", () => {
      test("Returns a ValidationError with custom message and action", async () => {
        const { response, responseBody } = await patchUser(username, {});

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          name: "ValidationError",
          status_code: 400,
          message: "Nenhum campo foi enviado para atualização do usuário.",
          action:
            "Envie pelo menos um dos campos permitidos para atualização: username, email, password.",
        });
      });
    });
    describe("With duplicated field", () => {
      test.each([
        {
          testName: "email",
          existingUser: {
            username: "existing_email_user",
            email: "existing_email@test.dev",
            password: "existing_email_password",
          },
          userInputValues: {
            email: "EXISTING_EMAIL@TEST.DEV",
          },
          expectedError: {
            name: "ValidationError",
            status_code: 400,
            message: "O email 'EXISTING_EMAIL@TEST.DEV' já está em uso.",
            action:
              "Forneça um email novo ou faça login com o email já existente.",
          },
        },
        {
          testName: "username",
          existingUser: {
            username: "existing_username",
            email: "existing_username@test.dev",
            password: "existing_username_password",
          },
          userInputValues: {
            username: "EXISTING_USERNAME",
          },
          expectedError: {
            name: "ValidationError",
            status_code: 400,
            message: "O username 'EXISTING_USERNAME' já está em uso.",
            action:
              "Forneça um username novo ou faça login com o username já existente.",
          },
        },
      ])(
        "The user is not updated when the $testName is duplicated",
        async ({ existingUser, userInputValues, expectedError }) => {
          await createDummyUser(existingUser);

          const { response, responseBody } = await patchUser(
            username,
            userInputValues,
          );

          expect(response.status).toBe(400);
          expect(responseBody).toEqual(expectedError);
        },
      );
    });

    describe("With invalid field", () => {
      test("Returns a ValidationError with custom message and action", async () => {
        const { response, responseBody } = await patchUser(username, {
          role: "admin",
        });

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          name: "ValidationError",
          status_code: 400,
          message: "O campo role não é permitido para atualização do usuário.",
          action:
            "Envie somente campos permitidos para atualização: username, email, password.",
        });
      });
    });
  });

  describe("Non-existent username", () => {
    test("'non_existent_user' returns 404 Not Found", async () => {
      const nonExistentUsername = "non_existent_user";

      const { response, responseBody } = await patchUser(nonExistentUsername, {
        email: "updated_email@test.dev",
      });

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        status_code: 404,
        message: `Usuário ${nonExistentUsername} não encontrado.`,
        action: `Verifique se o usuário ${nonExistentUsername} existe.`,
      });
    });
  });
});
