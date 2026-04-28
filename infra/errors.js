function toErrorJson(error, extra = {}) {
  return {
    name: error.name,
    status_code: error.statusCode,
    message: error.message,
    action: error.action,
    ...extra,
  };
}

class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno do servidor ocorreu.", { cause });
    this.name = "InternalServerError";
    this.action = "Se o problema persistir, entre em contato com o suporte.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return toErrorJson(this, { cause: this.cause?.toJSON?.() });
  }
}

class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido.");
    this.name = "MethodNotAllowedError";
    this.action = "Use um método HTTP válido para o endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return toErrorJson(this);
  }
}

class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Ocorreu um erro ao executar o serviço.", { cause });
    this.name = "ServiceError";
    this.action = "Verifique se o serviço está disponível.";
    this.statusCode = 503;
  }

  toJSON() {
    return toErrorJson(this, { cause: this.cause?.toJSON?.() });
  }
}

class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Ocorreu um erro de validação.", { cause });
    this.name = "ValidationError";
    this.action = action || "Verifique se os dados fornecidos são válidos.";
    this.statusCode = 400;
  }

  toJSON() {
    return toErrorJson(this, { cause: this.cause?.toJSON?.() });
  }
}

class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Recurso não encontrado.", { cause });
    this.name = "NotFoundError";
    this.action =
      action ||
      "Verifique se o recurso existe e se os parâmetros fornecidos são válidos.";
    this.statusCode = 404;
  }

  toJSON() {
    return toErrorJson(this, { cause: this.cause?.toJSON?.() });
  }
}

class AuthenticationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Erro de autenticação.", { cause });
    this.name = "AuthenticationError";
    this.action =
      action || "Verifique se o email e a senha fornecidos são válidos.";
    this.statusCode = 401;
  }

  /** Omit `cause` so nested NotFoundError etc. is never sent to clients (anti-enumeration). */
  toJSON() {
    return toErrorJson(this);
  }
}

export {
  InternalServerError,
  MethodNotAllowedError,
  ServiceError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
};
