import { getNewClient } from "infra/database.js";

const TEST_DATABASE_LOCK_ID = 1777590040231;
let testLockClient;

beforeEach(async () => {
  testLockClient = await getNewClient();
  await testLockClient.query("SELECT pg_advisory_lock($1);", [
    TEST_DATABASE_LOCK_ID,
  ]);
});

afterEach(async () => {
  if (!testLockClient) {
    return;
  }

  try {
    await testLockClient.query("SELECT pg_advisory_unlock($1);", [
      TEST_DATABASE_LOCK_ID,
    ]);
  } finally {
    await testLockClient.end();
    testLockClient = null;
  }
});
