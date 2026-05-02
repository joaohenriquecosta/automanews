import {
  exceptionHandlers,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import { registerUser } from "models/user.js";

const router = createRouter();

router.use(loadCurrentUser);
router.post(canRequest("create:user"), postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const registration = await registerUser(request.body);
  return response.status(registration.statusCode).json(registration.body);
}
