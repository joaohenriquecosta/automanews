import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  activateUser,
  getUser,
  postSession,
  testBaseUrl,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { createSession, SESSION_LIFETIME_MS } from "models/session.js";
import { parse as parseCookie } from "set-cookie-parser";

beforeAll(async () => {
  await waitForAllServices();
});

beforeEach(async () => {
  await clearDatabase();
  await runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("Returns ValidationError when email or password are not provided", async () => {
      const { response, responseBody } = await postSession({});
      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        name: "ValidationError",
        status_code: 400,
        message: "Email e senha são obrigatórios.",
        action: "Forneça um email e uma senha válidos.",
      });
    });

    test("Creates a session when email and password are valid", async () => {
      const existingUser = {
        username: "session_user",
        email: "session_user@test.dev",
        password: "correct_horse_battery",
      };
      const createdUser = await createDummyUser(existingUser);
      await activateUser(createdUser.id);

      const { response, responseBody } = await postSession({
        email: existingUser.email,
        password: existingUser.password,
      });

      expect(response.status).toBe(201);
      expect(responseBody.password).toBeUndefined();

      expect(uuidValidate(responseBody.id)).toBe(true);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidValidate(responseBody.user_id)).toBe(true);
      expect(uuidVersion(responseBody.user_id)).toBe(4);

      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(typeof responseBody.token).toBe("string");
      expect(responseBody.token).toHaveLength(96);

      const registeredUser = await getUser(existingUser.username);
      expect(responseBody.user_id).toBe(registeredUser.id);

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      const sessionLifetimeMs = expiresAt.getTime() - createdAt.getTime();

      expect(sessionLifetimeMs).toBeGreaterThan(SESSION_LIFETIME_MS - 2000);
      expect(sessionLifetimeMs).toBeLessThan(SESSION_LIFETIME_MS + 2000);

      const cookie = response.headers.get("Set-Cookie");
      const parsedCookies = parseCookie(cookie, { map: true });
      expect(parsedCookies.session_id).toMatchObject({
        name: "session_id",
        value: responseBody.token,
        maxAge: SESSION_LIFETIME_MS / 1000,
        httpOnly: true,
        path: "/",
      });
      expect(parsedCookies.session_id.secure).toBe(
        process.env.NODE_ENV === "production" ? true : undefined,
      );
    });

    test("Returns AuthenticationError when the password is wrong", async () => {
      await createDummyUser({
        username: "wrong_pass_user",
        email: "wrong_pass@test.dev",
        password: "real_secret",
      });

      const { response, responseBody } = await postSession({
        email: "wrong_pass@test.dev",
        password: "not_the_secret",
      });

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "AuthenticationError",
        status_code: 401,
        message: "Email ou senha inválidos.",
        action: "Verifique se o email e a senha fornecidos são válidos.",
      });
    });

    test("Returns AuthenticationError when the email is not registered (same message as wrong password)", async () => {
      const { response, responseBody } = await postSession({
        email: "nobody@test.dev",
        password: "any_password",
      });

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "AuthenticationError",
        status_code: 401,
        message: "Email ou senha inválidos.",
        action: "Verifique se o email e a senha fornecidos são válidos.",
      });
    });
  });

  describe("Standard user", () => {
    test("Returns ForbiddenError when the user cannot create sessions", async () => {
      const existingUser = await createDummyUser({
        username: "user_without_create_session",
        email: "user_without_create_session@test.dev",
        password: "password",
      });
      const session = await createSession(existingUser.id);

      const response = await fetch(`${testBaseUrl}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${session.token}`,
        },
        body: JSON.stringify({
          email: existingUser.email,
          password: "password",
        }),
      });

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: "Verifique se o seu usuário possui a feature create:session.",
      });
    });
  });
});
