import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { createUser, serializePublicUser } from "models/user.js";
import { sendActivationEmail } from "models/activation.js";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const newUser = await createUser(request.body);
  await sendActivationEmail(newUser);
  return response.status(201).json(serializePublicUser(newUser));
}
