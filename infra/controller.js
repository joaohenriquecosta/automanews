import {
  AuthenticationError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ForbiddenError,
  ServiceError,
  ValidationError,
} from "infra/errors.js";
import { serialize as serializeCookie } from "cookie";
import { SESSION_LIFETIME_MS, getValidSessionByToken } from "models/session.js";
import { getUserById, serializePublicUser } from "models/user.js";

export {
  exceptionHandlers,
  setSessionCookie,
  clearSessionCookie,
  loadCurrentUser,
  canRequest,
};

const exceptionHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

async function loadCurrentUser(request, response, next) {
  request.context = request.context || {};
  request.cookies?.session_id
    ? await injectAuthenticatedUser(request)
    : injectAnonymousUser(request);
  return next();
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const currentUserFeatures = request.context.user.features ?? [];
    if (!currentUserFeatures.includes(feature)) {
      throw new ForbiddenError({
        cause: new Error(`Missing feature ${feature}`),
        message: `Você não possui permissão para executar esta ação.`,
        action: `Verifique se o seu usuário possui a feature ${feature}.`,
      });
    }

    return next();
  };
}

async function injectAuthenticatedUser(request) {
  const token = request.cookies.session_id;
  const session = await getValidSessionByToken(token);
  const user = await getUserById(session.user_id);
  request.context.user = serializePublicUser(user);
}

function injectAnonymousUser(request) {
  request.context.user = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
}

function onNoMatchHandler(request, response) {
  const methodNotAllowed = new MethodNotAllowedError();
  return response.status(methodNotAllowed.statusCode).json(methodNotAllowed);
}

function onErrorHandler(error, request, response) {
  const COMMON_ERRORS = [
    ValidationError,
    ServiceError,
    MethodNotAllowedError,
    NotFoundError,
    ForbiddenError,
  ];

  if (error instanceof AuthenticationError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  for (const errorType of COMMON_ERRORS) {
    if (error instanceof errorType) {
      console.error(error);
      return response.status(error.statusCode).json(error);
    }
  }
  const fallbackError = new InternalServerError({
    cause: error,
  });
  console.error(fallbackError);
  return response.status(fallbackError.statusCode).json(fallbackError);
}

function setSessionCookie(sessionToken, response) {
  const setCookieValue = serializeCookie("session_id", sessionToken, {
    path: "/",
    maxAge: SESSION_LIFETIME_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });
  response.setHeader("Set-Cookie", setCookieValue);
}

function clearSessionCookie(response) {
  const setCookieValue = serializeCookie("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });
  response.setHeader("Set-Cookie", setCookieValue);
}
