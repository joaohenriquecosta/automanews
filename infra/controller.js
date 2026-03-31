import {
  InternalServerError,
  MethodNotAllowedError,
  ServiceError,
  ValidationError,
  NotFoundError,
} from "infra/errors.js";

const PUBLIC_ERRORS = [
  ValidationError,
  ServiceError,
  MethodNotAllowedError,
  NotFoundError,
];

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, request, response) {
  for (const errorType of PUBLIC_ERRORS) {
    if (error instanceof errorType) {
      console.error(error);
      return response.status(error.statusCode).json(error);
    }
  }
  const fallbackError = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
  console.error(fallbackError);
  return response.status(fallbackError.statusCode).json(fallbackError);
}

const exceptionHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

export { exceptionHandlers };
