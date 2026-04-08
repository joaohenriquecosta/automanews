/**
 * Waits until `next dev` serves JSON from the API routes integration tests use.
 * `wait-on` against /api/v1/status alone is not enough: Next compiles other routes
 * on first request; until then dynamic routes can return HTML error pages.
 */
const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const timeoutMs = Number(process.env.WAIT_FOR_NEXT_MS ?? 120_000);
const intervalMs = Number(process.env.WAIT_FOR_NEXT_INTERVAL_MS ?? 400);

const probeUsername = "__integration_probe_nonexistent_user__";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isJsonResponse(response) {
  const ct = response.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function assertNextApiReady() {
  const statusRes = await fetch(`${baseUrl}/api/v1/status`);
  if (statusRes.status !== 200 || !isJsonResponse(statusRes)) {
    throw new Error(
      `status: want 200+json, got ${statusRes.status} content-type=${statusRes.headers.get("content-type")}`,
    );
  }

  const userRes = await fetch(`${baseUrl}/api/v1/users/${probeUsername}`);
  if (userRes.status !== 404 || !isJsonResponse(userRes)) {
    throw new Error(
      `users/[username]: want 404+json, got ${userRes.status} content-type=${userRes.headers.get("content-type")}`,
    );
  }

  const usersIndexRes = await fetch(`${baseUrl}/api/v1/users`);
  if (
    (usersIndexRes.status !== 405 && usersIndexRes.status !== 404) ||
    !isJsonResponse(usersIndexRes)
  ) {
    throw new Error(
      `users index: want 404/405+json, got ${usersIndexRes.status} content-type=${usersIndexRes.headers.get("content-type")}`,
    );
  }

  const migrationsRes = await fetch(`${baseUrl}/api/v1/migrations`);
  if (migrationsRes.status !== 200 || !isJsonResponse(migrationsRes)) {
    throw new Error(
      `migrations: want 200+json, got ${migrationsRes.status} content-type=${migrationsRes.headers.get("content-type")}`,
    );
  }
}

async function main() {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await assertNextApiReady();
      console.log("Next.js dev API routes ready for integration tests.");
      return;
    } catch (error) {
      lastError = error;
      await sleep(intervalMs);
    }
  }

  console.error("Timed out waiting for Next.js dev server.", lastError);
  process.exit(1);
}

main();
