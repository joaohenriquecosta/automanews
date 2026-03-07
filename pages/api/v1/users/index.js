import { exceptionHandlers } from "infra/controller";
import { createRouter } from "next-connect";
import { createUser } from "models/user";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const newUser = await createUser(request.body);
  return response.status(201).json(newUser);
}
