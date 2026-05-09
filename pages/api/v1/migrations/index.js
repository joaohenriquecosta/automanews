import {
  listPendingMigrations,
  runPendingMigrations,
} from "models/migrator.js";
import {
  exceptionHandlers,
  canRequest,
  loadCurrentUser,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import { filterOutput } from "models/authorization.js";

export default createRouter()
  .use(loadCurrentUser)
  .get(canRequest("read:migration"), getHandler)
  .post(canRequest("create:migration"), postHandler)
  .handler({ ...exceptionHandlers });

async function getHandler(request, response) {
  const pendingMigrations = await listPendingMigrations();
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(
    userRequesting,
    "read:migration",
    pendingMigrations,
  );
  return response.status(200).json(secureOutput);
}

async function postHandler(request, response) {
  const migratedMigrations = await runPendingMigrations();
  const statusCode = migratedMigrations.length > 0 ? 201 : 200;
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(
    userRequesting,
    "read:migration",
    migratedMigrations,
  );
  return response.status(statusCode).json(secureOutput);
}
