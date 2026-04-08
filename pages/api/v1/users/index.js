import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { createUser, serializePublicUser } from "models/user.js";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const newUser = await createUser(request.body);
  return response.status(201).json(serializePublicUser(newUser));
}
