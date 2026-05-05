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

async function createActivatedUser(overrides = {}) {
  const user = await createDummyUser(overrides);
  return await activateUser(user.id);
}

function expectForbiddenUpdateUser(response, responseBody) {
  expect(response.status).toBe(403);
  expect(responseBody).toEqual({
    name: "ForbiddenError",
    status_code: 403,
    message: "Você não possui permissão para executar esta ação.",
    action: "Verifique se o seu usuário possui a feature update:user.",
  });
}

function expectUserNotFound(response, responseBody, username) {
  expect(response.status).toBe(404);
  expect(responseBody).toEqual({
    name: "NotFoundError",
    status_code: 404,
    message: `Usuário ${username} não encontrado.`,
    action: `Verifique se o usuário ${username} existe.`,
  });
}

function expectEmptyInputValidationError(response, responseBody) {
  expect(response.status).toBe(400);
  expect(responseBody).toEqual({
    name: "ValidationError",
    status_code: 400,
    message: "Nenhum campo foi enviado para atualização do usuário.",
    action:
      "Envie pelo menos um dos campos permitidos para atualização: username, email, password.",
  });
}

function expectInvalidFieldValidationError(response, responseBody) {
  expect(response.status).toBe(400);
  expect(responseBody).toEqual({
    name: "ValidationError",
    status_code: 400,
    message: "O campo role não é permitido para atualização do usuário.",
    action:
      "Envie somente campos permitidos para atualização: username, email, password.",
  });
}

const DUPLICATED_FIELD_CASES = [
  {
    testName: "duplicated email",
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
      action: "Forneça um email novo ou faça login com o email já existente.",
    },
  },
  {
    testName: "duplicated username",
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
];

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Receives NotFoundError when the target user does not exist", async () => {
      expect.assertions(2);
      const nonExistentUsername = "non_existent_user";

      const { response, responseBody } = await patchUser(nonExistentUsername, {
        email: "anonymous_update@test.dev",
      });

      expectUserNotFound(response, responseBody, nonExistentUsername);
    });

    test("Does not update any user", async () => {
      const targetUser = await createActivatedUser();

      const { response, responseBody } = await patchUser(targetUser.username, {
        email: "anonymous_update@test.dev",
      });

      expectForbiddenUpdateUser(response, responseBody);

      const targetUserInDatabase = await getUser(targetUser.username);
      expect(targetUserInDatabase.email).toBe(targetUser.email);
    });
  });

  describe("Standard user", () => {
    let standardUser, session, otherUser;

    beforeEach(async () => {
      standardUser = await createActivatedUser({
        username: "standard_user",
        email: "standard.user@test.dev",
        password: "standard_user_password",
      });
      session = await createSessionForUser(standardUser.id);
      otherUser = await createActivatedUser({
        username: "other_user",
        email: "other.user@test.dev",
        password: "other_user_password",
      });
    });

    test("Receives NotFoundError when the target user does not exist", async () => {
      expect.assertions(2);
      const nonExistentUsername = "non_existent_user";

      const { response, responseBody } = await patchUser(
        nonExistentUsername,
        {
          email: "standard_update@test.dev",
        },
        session.token,
      );

      expectUserNotFound(response, responseBody, nonExistentUsername);
    });

    test("Updates itself with valid input", async () => {
      const validUserInputValues = {
        username: "patched_standard_user",
        email: "patched.standard.user@test.dev",
        password: "patched_standard_user_password",
      };

      const { response, responseBody } = await patchUser(
        standardUser.username,
        validUserInputValues,
        session.token,
      );

      expect(response.status).toBe(200);
      expect(responseBody.updated_at > standardUser.updated_at).toBe(true);
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

      const isStoredHashValid = await comparePassword(
        validUserInputValues.password,
        userInDatabase.password,
      );
      expect(isStoredHashValid).toBe(true);
    });

    test.each(DUPLICATED_FIELD_CASES)(
      "Does not update itself with $testName",
      async ({ existingUser, userInputValues, expectedError }) => {
        await createDummyUser(existingUser);

        const { response, responseBody } = await patchUser(
          standardUser.username,
          userInputValues,
          session.token,
        );

        expect(response.status).toBe(400);
        expect(responseBody).toEqual(expectedError);

        const standardUserInDatabase = await getUser(standardUser.username);
        expect(standardUserInDatabase.email).toBe(standardUser.email);
      },
    );

    test("Does not update another user", async () => {
      const { response, responseBody } = await patchUser(
        otherUser.username,
        {
          email: "standard_attempt_update@test.dev",
        },
        session.token,
      );

      expectForbiddenUpdateUser(response, responseBody);

      const otherUserInDatabase = await getUser(otherUser.username);
      expect(otherUserInDatabase.email).toBe(otherUser.email);
    });
  });

  describe("Privileged user", () => {
    let privilegedUser, session, otherUser;
    const privilegedFeatures = [
      ...DEFAULT_ACTIVATED_USER_FEATURES,
      "update:user:others",
    ];

    beforeEach(async () => {
      privilegedUser = await createActivatedUser({
        username: "privileged_user",
        email: "privileged.user@test.dev",
        password: "privileged_user_password",
      });
      await addFeatures(privilegedUser.id, ["update:user:others"]);
      session = await createSessionForUser(privilegedUser.id);
      otherUser = await createDummyUser({
        username: "privileged_target",
        email: "privileged.target@test.dev",
        password: "privileged_target_password",
      });
    });

    test("Receives NotFoundError when the target user does not exist", async () => {
      expect.assertions(2);
      const nonExistentUsername = "non_existent_user";

      const { response, responseBody } = await patchUser(
        nonExistentUsername,
        {
          email: "privileged_update@test.dev",
        },
        session.token,
      );

      expectUserNotFound(response, responseBody, nonExistentUsername);
    });

    test.each([
      {
        testName: "itself",
        getTargetUser: () => privilegedUser,
        userInputValues: {
          username: "patched_privileged_user",
          email: "patched.privileged.user@test.dev",
        },
        expectedFeatures: privilegedFeatures,
      },
      {
        testName: "another user",
        getTargetUser: () => otherUser,
        userInputValues: {
          username: "patched_privileged_target",
          email: "patched.privileged.target@test.dev",
        },
        expectedFeatures: DEFAULT_UNACTIVATED_USER_FEATURES,
      },
    ])(
      "Updates $testName with valid input",
      async ({ getTargetUser, userInputValues, expectedFeatures }) => {
        const targetUser = getTargetUser();

        const { response, responseBody } = await patchUser(
          targetUser.username,
          userInputValues,
          session.token,
        );

        expect(response.status).toBe(200);

        const userInDatabase = await getUser(userInputValues.username);
        expect(responseBody).toEqual({
          id: targetUser.id,
          username: userInputValues.username,
          email: userInputValues.email,
          features: expectedFeatures,
          created_at: userInDatabase.created_at,
          updated_at: userInDatabase.updated_at,
        });
        expect(responseBody.password).toBeUndefined();
      },
    );

    test("Does not update itself with empty input", async () => {
      expect.assertions(2);
      const { response, responseBody } = await patchUser(
        privilegedUser.username,
        {},
        session.token,
      );

      expectEmptyInputValidationError(response, responseBody);
    });

    test("Does not update another user with an invalid field", async () => {
      expect.assertions(2);
      const { response, responseBody } = await patchUser(
        otherUser.username,
        {
          role: "admin",
        },
        session.token,
      );

      expectInvalidFieldValidationError(response, responseBody);
    });

    test.each(DUPLICATED_FIELD_CASES)(
      "Does not update another user with $testName",
      async ({ existingUser, userInputValues, expectedError }) => {
        await createDummyUser(existingUser);

        const { response, responseBody } = await patchUser(
          otherUser.username,
          userInputValues,
          session.token,
        );

        expect(response.status).toBe(400);
        expect(responseBody).toEqual(expectedError);
      },
    );
  });
});
