import {
  exceptionHandlers,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import { getSystemStatus } from "models/status.js";
import { filterOutput } from "models/authorization.js";

const router = createRouter();

router.use(loadCurrentUser);
router.get(canRequest("read:status"), getHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const dbStatus = await getSystemStatus();
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(userRequesting, "read:status", dbStatus);
  return response.status(200).json(secureOutput);
}
