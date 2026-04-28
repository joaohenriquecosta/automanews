import {
  AuthenticationError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "infra/errors.js";
import { serialize as serializeCookie } from "cookie";
import { SESSION_LIFETIME_MS } from "models/session.js";

export { exceptionHandlers, setSessionCookie, clearSessionCookie };

const exceptionHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

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

async function setSessionCookie(sessionToken, response) {
  const setCookieValue = serializeCookie("session_id", sessionToken, {
    path: "/",
    maxAge: SESSION_LIFETIME_MS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookieValue);
}

async function clearSessionCookie(response) {
  const setCookieValue = serializeCookie("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookieValue);
}
