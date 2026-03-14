import retry from "async-retry";
import { query } from "infra/database";
import { createUser, getUserByUsername } from "models/user";

async function waitForAllServices() {
  return await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 10,
      maxTimeout: 1000,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt ${attempt} failed to fetch status page. Error: ${error.message}`,
        );
      },
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw new Error(`Expected status 200 but received ${response.status}`);
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

async function createDummyUser(overrides = {}) {
  const dummyUserInfo = {
    username: "dummy_user",
    email: "dummy_email@test.dev",
    password: "dummy_password",
    ...overrides,
  };

  const dummyUser = await createUser(dummyUserInfo);
  return serializeUser(dummyUser);
}

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

async function getUser(username) {
  const user = await getUserByUsername(username);
  return serializeUser(user);
}

export {
  waitForAllServices,
  clearDatabase,
  createDummyUser,
  postUser,
  getUser,
};
