import { exceptionHandlers } from "infra/controller";
import { createRouter } from "next-connect";
import { getUserByUsername, updateUser } from "models/user";

const router = createRouter();

router.get(getHandler).patch(patchHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const user = await getUserByUsername(username);
  return response.status(200).json(user);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const updatedUser = await updateUser(username, userInputValues);
  return response.status(200).json(updatedUser);
}
