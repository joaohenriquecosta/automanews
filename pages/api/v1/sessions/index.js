import {
  exceptionHandlers,
  setSessionCookie,
  clearSessionCookie,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import {
  createSession,
  getValidSessionByToken,
  expireSessionById,
} from "models/session.js";
import { getUser } from "models/authentication.js";
import { filterOutput } from "models/authorization.js";

export default createRouter()
  .use(loadCurrentUser)
  .post(canRequest("create:session"), postHandler)
  .delete(deleteHandler)
  .handler({ ...exceptionHandlers });

async function postHandler(request, response) {
  const { email, password } = request.body ?? {};
  const user = await getUser(email, password);
  const newSession = await createSession(user.id);

  setSessionCookie(newSession.token, response);

  const secureOutput = filterOutput(user, "read:session", newSession);

  return response.status(201).json(secureOutput);
}

async function deleteHandler(request, response) {
  const token = request.cookies.session_id;
  const session = await getValidSessionByToken(token);
  const expiredSession = await expireSessionById(session.id);
  clearSessionCookie(response);
  const userRequesting = request.context.user;
  const secureOutput = filterOutput(
    userRequesting,
    "read:session",
    expiredSession,
  );
  return response.status(200).json(secureOutput);
}
