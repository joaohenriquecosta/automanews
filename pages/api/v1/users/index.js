import {
  exceptionHandlers,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import { registerUser } from "models/user.js";

export default createRouter()
  .use(loadCurrentUser)
  .post(canRequest("create:user"), postHandler)
  .handler({ ...exceptionHandlers });

async function postHandler(request, response) {
  const registration = await registerUser(request.body);
  return response.status(registration.statusCode).json(registration.body);
}
