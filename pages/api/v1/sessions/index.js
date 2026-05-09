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
import { getAuthenticatedUser } from "models/authentication.js";
import { filterOutput } from "models/authorization.js";

const router = createRouter();

router.use(loadCurrentUser);
router.post(canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const { email, password } = request.body ?? {};
  const user = await getAuthenticatedUser(email, password);
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
