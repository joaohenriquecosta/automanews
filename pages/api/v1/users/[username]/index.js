import {
  exceptionHandlers,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import {
  getUserByUsername,
  updateUser,
  serializePublicUser,
} from "models/user.js";

const router = createRouter();

router.use(loadCurrentUser);
router.get(getHandler);
router.patch(canRequest("update:user", getResource), patchHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const user = await getUserByUsername(username);
  return response.status(200).json(serializePublicUser(user));
}

async function patchHandler(request, response) {
  const { username } = request.context.resource;
  const currentUser = request.context.user;
  const userInputValues = request.body;
  const updatedUser = await updateUser(username, userInputValues, currentUser);
  return response.status(200).json(serializePublicUser(updatedUser));
}

async function getResource(request) {
  const { username } = request.query;
  return await getUserByUsername(username);
}
