import retry from "async-retry";
import { query } from "infra/database";
import { createUser, getUserByUsername } from "models/user";

/** Use 127.0.0.1 so probes match `wait-for-next-dev.js` and avoid IPv6/localhost quirks on Linux. */
export const testBaseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

export {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  serializeUser,
  serializePublicUser,
  postUser,
  postSession,
  getUser,
  deleteAllEmails,
  getLastEmail,
};

function isJsonResponse(response) {
  const ct = response.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

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

  async function waitForEmailServer() {
    return retry(assertEmailServerOk, {
      retries: 30,
      maxTimeout: 1500,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt ${attempt} failed waiting for MailCatcher. Error: ${error.message}`,
        );
      },
    });

    async function assertEmailServerOk() {
      const res = await fetch(emailHttpUrl);
      if (res.status !== 200) {
        throw new Error(`mailcatcher: want 200, got ${res.status}`);
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

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const response = await fetch(`${emailHttpUrl}/messages`, {
    method: "GET",
  });
  const emails = await response.json();
  const lastEmail = emails.pop();

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmail.id}.plain`,
  );

  const lastEmailTextBody = await emailTextResponse.text();

  lastEmail.text = lastEmailTextBody;

  return lastEmail;
}
