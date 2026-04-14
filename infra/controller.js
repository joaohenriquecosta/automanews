import {
  AuthenticationError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "infra/errors.js";

export { exceptionHandlers };

const exceptionHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

function onNoMatchHandler(request, response) {
  const methodNotAllowed = new MethodNotAllowedError();
  return response.status(methodNotAllowed.statusCode).json(methodNotAllowed);
}

function onErrorHandler(error, request, response) {
  const KNOWN_ERRORS = [
    ValidationError,
    ServiceError,
    MethodNotAllowedError,
    NotFoundError,
    AuthenticationError,
  ];

  for (const errorType of KNOWN_ERRORS) {
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
