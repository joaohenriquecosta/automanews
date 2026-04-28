import retry from "async-retry";
import { query } from "infra/database";
import { createUser, getUserByUsername } from "models/user";

/** Use 127.0.0.1 so probes match `wait-for-next-dev.js` and avoid IPv6/localhost quirks on Linux. */
export const testBaseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";

export {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  serializeUser,
  serializePublicUser,
  postUser,
  postSession,
  getUser,
};

function isJsonResponse(response) {
  const ct = response.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function waitForAllServices() {
  return await waitForWebServer();

  async function waitForWebServer() {
    return retry(assertStatusJsonOk, {
      retries: 30,
      maxTimeout: 1500,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt ${attempt} failed waiting for Next.js API. Error: ${error.message}`,
        );
      },
    });

    async function assertStatusJsonOk() {
      const statusRes = await fetch(`${testBaseUrl}/api/v1/status`);
      if (statusRes.status !== 200 || !isJsonResponse(statusRes)) {
        throw new Error(
          `status: want 200+json, got ${statusRes.status} content-type=${statusRes.headers.get("content-type")}`,
        );
      }
    }
  }
}

async function clearDatabase() {
  await query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

function serializeUser(user) {
  return {
    ...user,
    created_at: new Date(user.created_at).toISOString(),
    updated_at: new Date(user.updated_at).toISOString(),
  };
}

function serializePublicUser(user) {
  const serialized = serializeUser(user);
  delete serialized.password;
  return serialized;
}

async function createDummyUser(overrides = {}) {
  const dummyUserInfo = {
    username: "dummy_user",
    email: "dummy_email@test.dev",
    password: "dummy_password",
    ...overrides,
  };

  const dummyUser = await createUser(dummyUserInfo);
  return serializePublicUser(dummyUser);
}

async function postUser(userInput) {
  const response = await fetch(`${testBaseUrl}/api/v1/users`, {
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

async function postSession(credentials) {
  const response = await fetch(`${testBaseUrl}/api/v1/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const responseBody = await response.json();

  return {
    response,
    responseBody,
  };
}

async function getUser(username) {
  const user = await getUserByUsername(username);
  return serializeUser(user);
}
