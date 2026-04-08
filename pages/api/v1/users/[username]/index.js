import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { getUserByUsername, updateUser, serializePublicUser } from "models/user.js";

const router = createRouter();

router.get(getHandler).patch(patchHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const user = await getUserByUsername(username);
  return response.status(200).json(serializePublicUser(user));
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const updatedUser = await updateUser(username, userInputValues);
  return response.status(200).json(serializePublicUser(updatedUser));
}
