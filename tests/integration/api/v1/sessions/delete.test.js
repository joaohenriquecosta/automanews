import {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  testBaseUrl,
} from "tests/orchestrator.js";
import { runPendingMigrations } from "models/migrator.js";
import { createSession, SESSION_LIFETIME_MS } from "models/session.js";
import { randomBytes } from "node:crypto";
import { parse as parseCookie } from "set-cookie-parser";

let dummyUser;

beforeAll(async () => {
  await waitForAllServices();
  await clearDatabase();
  await runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Standard user", () => {
    test("With valid session token", async () => {
      dummyUser = await createDummyUser({ password: "password" });
      const session = await createSession(dummyUser.id);
      const response = await fetch(`${testBaseUrl}/api/v1/sessions`, {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const oneYearBeforeExpiresAt = new Date(session.expires_at);
      oneYearBeforeExpiresAt.setFullYear(
        oneYearBeforeExpiresAt.getFullYear() - 1,
      );

      expect(responseBody).toMatchObject({
        id: session.id,
        user_id: session.user_id,
        expires_at: oneYearBeforeExpiresAt.toISOString(),
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(responseBody.expires_at < session.expires_at.toISOString()).toBe(
        true,
      );

      expect(responseBody.updated_at > session.updated_at.toISOString()).toBe(
        true,
      );

      const parsedCookies = parseCookie(response.headers.get("Set-Cookie"), {
        map: true,
      });
      expect(parsedCookies.session_id).toMatchObject({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        httpOnly: true,
        path: "/",
      });

      const doubleCheckResponse = await fetch(`${testBaseUrl}/api/v1/user`, {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      expect(doubleCheckResponse.status).toBe(401);
      expect(doubleCheckResponse.headers.get("Set-Cookie")).toBe(
        "session_id=invalid; Max-Age=-1; Path=/; HttpOnly; SameSite=Lax",
      );
    });
  });

  test("With invalid session token", async () => {
    const invalidToken = randomBytes(48).toString("hex");
    const response = await fetch(`${testBaseUrl}/api/v1/sessions`, {
      method: "DELETE",
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
    const response = await fetch(`${testBaseUrl}/api/v1/sessions`, {
      method: "DELETE",
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
