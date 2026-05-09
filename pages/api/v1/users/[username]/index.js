import {
  exceptionHandlers,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import { getUserByUsername, updateUser } from "models/user.js";
import { filterOutput } from "models/authorization.js";

const router = createRouter();

router.use(loadCurrentUser);
router.get(getHandler);
router.patch(canRequest("update:user", getTargetUser), patchHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const userFound = await getUserByUsername(username);
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(userRequesting, "read:user", userFound);
  return response.status(200).json(secureOutput);
}

async function patchHandler(request, response) {
  const { username } = request.context.resource;
  const currentUser = request.context.user;
  const userInputValues = request.body;
  const updatedUser = await updateUser(username, userInputValues, currentUser);
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(userRequesting, "read:user", updatedUser);
  return response.status(200).json(secureOutput);
}

async function getTargetUser(request) {
  const { username } = request.query;
  return await getUserByUsername(username);
}
