import {
  exceptionHandlers,
  setSessionCookie,
  clearSessionCookie,
} from "infra/controller.js";
import { createRouter } from "next-connect";
import {
  createSession,
  getValidSessionByToken,
  expireSessionById,
} from "models/session.js";

const router = createRouter();

router.post(postHandler).delete(deleteHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const { email, password } = request.body ?? {};
  const newSession = await createSession({ email, password });

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
