import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  activateUser,
  createSessionForUser,
  getUser,
  testBaseUrl,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { comparePassword } from "models/password";
import {
  DEFAULT_ACTIVATED_USER_FEATURES,
  DEFAULT_UNACTIVATED_USER_FEATURES,
} from "models/authorization.js";
import { addFeatures } from "models/user.js";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
});

async function patchUser(username, userInputValues, sessionToken) {
  const response = await fetch(`${testBaseUrl}/api/v1/users/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Cookie: `session_id=${sessionToken}` } : {}),
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
    let dummyUser, username, session;

    beforeEach(async () => {
      dummyUser = await createDummyUser();
      dummyUser = await activateUser(dummyUser.id);
      session = await createSessionForUser(dummyUser.id);
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
          session.token,
        );

        expect(response.status).toBe(200);
        expect(responseBody.updated_at > dummyUser.updated_at).toBe(true);
        expect(responseBody.updated_at > responseBody.created_at).toBe(true);

        const userInDatabase = await getUser(validUserInputValues.username);

        expect(responseBody).toEqual({
          id: userInDatabase.id,
          username: validUserInputValues.username,
          email: validUserInputValues.email,
          features: DEFAULT_ACTIVATED_USER_FEATURES,
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
        await patchUser(username, validUserInputValues, session.token);

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
        const { response, responseBody } = await patchUser(
          username,
          {},
          session.token,
        );

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
            session.token,
          );

          expect(response.status).toBe(400);
          expect(responseBody).toEqual(expectedError);
        },
      );
    });

    describe("With invalid field", () => {
      test("Returns a ValidationError with custom message and action", async () => {
        const { response, responseBody } = await patchUser(
          username,
          {
            role: "admin",
          },
          session.token,
        );

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
      const currentUser = await createDummyUser({
        username: "current_user",
        email: "current_user@test.dev",
        password: "current_user_password",
      });
      const activatedCurrentUser = await activateUser(currentUser.id);
      const session = await createSessionForUser(activatedCurrentUser.id);

      const { response, responseBody } = await patchUser(
        nonExistentUsername,
        {
          email: "updated_email@test.dev",
        },
        session.token,
      );

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        status_code: 404,
        message: `Usuário ${nonExistentUsername} não encontrado.`,
        action: `Verifique se o usuário ${nonExistentUsername} existe.`,
      });
    });
  });

  describe("Anonymous user", () => {
    test("Returns ForbiddenError when trying to update a user", async () => {
      const existingUser = await createDummyUser();

      const { response, responseBody } = await patchUser(existingUser.username, {
        email: "anonymous_update@test.dev",
      });

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature update:user.",
      });
    });
  });

  describe("Another user", () => {
    test("Returns ForbiddenError when trying to update a different user", async () => {
      const owner = await createDummyUser({
        username: "owner_user",
        email: "owner_user@test.dev",
        password: "owner_user_password",
      });
      const otherUser = await createDummyUser({
        username: "other_user",
        email: "other_user@test.dev",
        password: "other_user_password",
      });
      const activatedOtherUser = await activateUser(otherUser.id);
      const session = await createSessionForUser(activatedOtherUser.id);

      const { response, responseBody } = await patchUser(
        owner.username,
        {
          email: "malicious_update@test.dev",
        },
        session.token,
      );

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature update:user.",
      });

      const ownerInDatabase = await getUser(owner.username);
      expect(ownerInDatabase.features).toEqual(
        DEFAULT_UNACTIVATED_USER_FEATURES,
      );
      expect(ownerInDatabase.email).toBe(owner.email);
    });
  });

  describe("Privileged user", () => {
    test("Updates another user when it has update:user:others", async () => {
      const owner = await createDummyUser({
        username: "privileged_target",
        email: "privileged.target@test.dev",
        password: "privileged_target_password",
      });
      const privilegedUser = await createDummyUser({
        username: "privileged_user",
        email: "privileged.user@test.dev",
        password: "privileged_user_password",
      });
      const activatedPrivilegedUser = await activateUser(privilegedUser.id);
      await addFeatures(activatedPrivilegedUser.id, ["update:user:others"]);
      const session = await createSessionForUser(activatedPrivilegedUser.id);

      const { response, responseBody } = await patchUser(
        owner.username,
        {
          email: "updated.by.privileged@test.dev",
        },
        session.token,
      );

      expect(response.status).toBe(200);
      expect(responseBody).toMatchObject({
        id: owner.id,
        username: owner.username,
        email: "updated.by.privileged@test.dev",
        features: DEFAULT_UNACTIVATED_USER_FEATURES,
      });

      const ownerInDatabase = await getUser(owner.username);
      expect(ownerInDatabase.email).toBe("updated.by.privileged@test.dev");
    });
  });
});
