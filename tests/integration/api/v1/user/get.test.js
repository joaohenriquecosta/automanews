import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  serializePublicUser,
  testBaseUrl,
  activateUser,
} from "tests/orchestrator.js";
import { randomBytes } from "node:crypto";
import {
  createSession,
  getValidSessionByToken,
  SESSION_LIFETIME_MS,
} from "models/session.js";
import { runPendingMigrations } from "models/migrator.js";
import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { parse as parseCookie } from "set-cookie-parser";

let dummyUser;
let session;

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
  dummyUser = await createDummyUser({ password: "password" });
  dummyUser = await activateUser(dummyUser.id);
  session = await createSession(dummyUser.id);
});

describe("GET /api/v1/user", () => {
  describe("Standard user", () => {
    test("With valid session token", async () => {
      const response = await fetch(`${testBaseUrl}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);

      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      expect(uuidValidate(dummyUser.id)).toBe(true);
      expect(uuidVersion(dummyUser.id)).toBe(4);
      expect(responseBody).toEqual(serializePublicUser(dummyUser));

      const renewedSession = await getValidSessionByToken(session.token);

      expect(renewedSession.expires_at > session.expires_at).toBe(true);
      expect(renewedSession.updated_at > session.updated_at).toBe(true);

      expect(session.token).toEqual(renewedSession.token);

      const cookie = response.headers.get("Set-Cookie");
      const parsedCookies = parseCookie(cookie, { map: true });
      expect(parsedCookies.session_id).toMatchObject({
        name: "session_id",
        value: renewedSession.token,
        maxAge: SESSION_LIFETIME_MS / 1000,
        httpOnly: true,
        path: "/",
      });
      expect(parsedCookies.session_id.secure).toBe(
        process.env.NODE_ENV === "production" ? true : undefined,
      );
    });

    test("With almost expired session token (5 min left)", async () => {
      const timeToExpire = 1000 * 60 * 5; // 5 minutes
      jest.useFakeTimers({
        now: new Date(Date.now() - SESSION_LIFETIME_MS + timeToExpire),
      });
      const almostExpiredSession = await createSession(dummyUser.id);
      jest.useRealTimers();

      const almostExpiredSessionToken = almostExpiredSession.token;
      const response = await fetch(`${testBaseUrl}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${almostExpiredSessionToken}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);

      expect(response.headers.get("Cache-Control")).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      expect(uuidValidate(dummyUser.id)).toBe(true);
      expect(uuidVersion(dummyUser.id)).toBe(4);
      expect(responseBody).toEqual(serializePublicUser(dummyUser));

      const renewedSession = await getValidSessionByToken(
        almostExpiredSessionToken,
      );

      expect(renewedSession.expires_at > session.expires_at).toBe(true);
      expect(renewedSession.updated_at > session.updated_at).toBe(true);

      expect(almostExpiredSessionToken).toEqual(renewedSession.token);

      const cookie = response.headers.get("Set-Cookie");
      const parsedCookies = parseCookie(cookie, { map: true });
      expect(parsedCookies.session_id).toMatchObject({
        name: "session_id",
        value: renewedSession.token,
        maxAge: SESSION_LIFETIME_MS / 1000,
        httpOnly: true,
        path: "/",
      });
      expect(parsedCookies.session_id.secure).toBe(
        process.env.NODE_ENV === "production" ? true : undefined,
      );
    });

    test("With invalid session token", async () => {
      const invalidToken = randomBytes(48).toString("hex");
      const response = await fetch(`${testBaseUrl}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${invalidToken}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "AuthenticationError",
        status_code: 401,
        message: "Sessão inválida.",
        action: "Faça login para continuar.",
      });
    });

    test("With expired session token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - SESSION_LIFETIME_MS),
      });
      const expiredSession = await createSession(dummyUser.id);
      jest.useRealTimers();

      const expiredSessionToken = expiredSession.token;
      const response = await fetch(`${testBaseUrl}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${expiredSessionToken}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "AuthenticationError",
        status_code: 401,
        message: "Sessão inválida.",
        action: "Faça login para continuar.",
      });
    });
  });

  describe("Anonymous user", () => {
    test("Without session token", async () => {
      const response = await fetch(`${testBaseUrl}/api/v1/user`);
      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
      });
    });
  });
});
