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
import { isAllowedTo } from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

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
  if (!isAllowedTo(user, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para criar sessões.",
      action: "Ative sua conta ou entre em contato com o suporte.",
    });
  }
  const newSession = await createSession(user.id);

  setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const token = request.cookies.session_id;
  const session = await getValidSessionByToken(token);
  const expiredSession = await expireSessionById(session.id);
  clearSessionCookie(response);
  return response.status(200).json(expiredSession);
}
