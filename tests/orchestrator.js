import retry from "async-retry";
import db from "infra/database.js";

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
  await db.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

async function createDummyUser() {
  const dummyUserInfo = {
    username: "dummy_user",
    email: "dummy_email@test.dev",
    password: "dummy_password",
  };

  const queryResult = await db.query({
    text: `
      INSERT INTO
        users (username, email, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    ;`,
    values: [
      dummyUserInfo.username,
      dummyUserInfo.email,
      dummyUserInfo.password,
    ],
  });

  return {
    ...queryResult.rows[0],
    created_at: new Date(queryResult.rows[0].created_at).toISOString(),
    updated_at: new Date(queryResult.rows[0].updated_at).toISOString(),
  };
}

export { waitForAllServices, clearDatabase, createDummyUser };
