import {
  listPendingMigrations,
  runPendingMigrations,
} from "models/migrator.js";
import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";

const router = createRouter();

router.get(getHandler).post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const pendingMigrations = await listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await runPendingMigrations();
  const statusCode = migratedMigrations.length > 0 ? 201 : 200;
  return response.status(statusCode).json(migratedMigrations);
}
