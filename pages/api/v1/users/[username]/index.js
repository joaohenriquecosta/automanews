import { exceptionHandlers } from "infra/controller";
import { createRouter } from "next-connect";
import { getUserByUsername } from "models/user";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const { username } = request.query;
  const user = await getUserByUsername(username);
  return response.status(200).json(user);
}
