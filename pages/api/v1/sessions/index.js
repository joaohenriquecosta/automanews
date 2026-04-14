import { exceptionHandlers } from "infra/controller.js";
import { createRouter } from "next-connect";
import { createSession, SESSION_LIFETIME_MS } from "models/session.js";
import { serialize as serializeCookie } from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  ...exceptionHandlers,
});

async function postHandler(request, response) {
  const { email, password } = request.body ?? {};
  const newSession = await createSession({ email, password });

  const setCookieValue = serializeCookie("session_id", newSession.token, {
    path: "/",
    maxAge: SESSION_LIFETIME_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookieValue);

  return response.status(201).json(newSession);
}
