import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { getSystemStatus } from "models/status.js";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const dbStatus = await getSystemStatus();
  return response.status(200).json(dbStatus);
}
