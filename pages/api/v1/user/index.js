import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { getValidSessionByToken, refreshSession } from "models/session.js";
import { getUserById, serializePublicUser } from "models/user.js";
import {
  setSessionCookie,
  loadCurrentUser,
  canRequest,
} from "infra/controller.js";

const router = createRouter();

router.use(loadCurrentUser);
router.get(canRequest("read:session"), getHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function getHandler(request, response) {
  const token = request.cookies.session_id;
  const session = await getValidSessionByToken(token);
  const refreshedSession = await refreshSession(session.id);

  setSessionCookie(refreshedSession.token, response);
  const user = await getUserById(refreshedSession.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  return response.status(200).json(serializePublicUser(user));
}
