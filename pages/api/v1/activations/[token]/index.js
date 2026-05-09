import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { activateUserByToken } from "models/activation.js";
import { loadCurrentUser, canRequest } from "infra/controller.js";
import { filterOutput } from "models/authorization.js";

export default createRouter()
  .use(loadCurrentUser)
  .patch(canRequest("read:activation_token"), patchHandler)
  .handler({ ...exceptionHandlers });

async function patchHandler(request, response) {
  const { token } = request.query;
  const usedActivationToken = await activateUserByToken(token);

  const userRequesting = request.context.user;
  const secureOutput = filterOutput(
    userRequesting,
    "read:activation_token",
    usedActivationToken,
  );
  return response.status(200).json(secureOutput);
}
