import { MethodNotAllowedError, InternalServerError } from "infra/errors";

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();
  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, request, response) {
  const publicError = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });
  return response.status(publicError.statusCode).json(publicError);
}

const exceptionHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};

const controller = {
  exceptionHandlers,
};

export { exceptionHandlers };
export default controller;
