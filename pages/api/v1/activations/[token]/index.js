import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { activateUserByToken } from "models/activation.js";
import { loadCurrentUser, canRequest } from "infra/controller.js";

const router = createRouter();

router.use(loadCurrentUser);
router.patch(canRequest("read:activation_token"), patchHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function patchHandler(request, response) {
  const { token } = request.query;
  const usedActivationToken = await activateUserByToken(token);

  return response.status(200).json({
    used_activation_token: usedActivationToken,
  });
}
