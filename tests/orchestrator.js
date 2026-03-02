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

export { waitForAllServices, clearDatabase };
