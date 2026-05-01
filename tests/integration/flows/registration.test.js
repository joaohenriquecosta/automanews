import {
  waitForAllServices,
  clearDatabase,
  deleteAllEmails,
  postUser,
  getLastEmail,
  getUser,
  getActivationTokenByUserId,
  testBaseUrl,
} from "tests/orchestrator";
import { runPendingMigrations } from "models/migrator.js";

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
  await deleteAllEmails();
});

describe("Use case: Successful registration flow", () => {
  test("Create a new user returns the user data", async () => {
    const userInput = {
      username: "RegistrationFlowTest",
      email: "registration.flow@test.com",
      password: "registrationflowtest",
    };
    const { response, responseBody } = await postUser(userInput);
    const { response2, responseBody2 } = await postUser(userInput);
    console.log(response2, responseBody2);

    expect(response.status).toBe(201);
    expect(responseBody).toMatchObject({
      id: responseBody.id,
      username: "RegistrationFlowTest",
      email: "registration.flow@test.com",
      features: ["read:activation_token"],
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
  });

  test("Activation email is sent with correct content and activation link", async () => {
    const user = await getUser("RegistrationFlowTest");
    const lastEmail = await getLastEmail();
    expect(lastEmail.sender).toBe("<contato@automanews.com.br>");
    expect(lastEmail.recipients[0]).toBe(`<${user.email}>`);
    expect(lastEmail.subject).toBe("Ative a sua conta no AutomaNews!");
    expect(lastEmail.text).toContain(`${user.username}`);

    const activationToken = await getActivationTokenByUserId(user.id);
    expect(lastEmail.text).toContain(
      `${testBaseUrl}/cadastro/ativar/${activationToken.token}`,
    );

    expect(activationToken.used_at).toBeNull();
  });

  // The activation link activates the user account with the base permissions

  // Login with user account should create a new session
});
