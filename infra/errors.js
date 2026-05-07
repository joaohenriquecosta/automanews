function serializeError(error, extra = {}) {
  return {
    name: error.name,
    status_code: error.statusCode,
    message: error.message,
    action: error.action,
    context: error.context,
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

  /** Omit `cause` so internal details (e.g. model validation) never reach clients. */
  toJSON() {
    return serializeError(this);
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
    return serializeError(this);
  }
}

class ServiceError extends Error {
  constructor({ cause, message, action, context }) {
    super(message || "Ocorreu um erro ao executar o serviço.", { cause });
    this.name = "ServiceError";
    this.action = action || "Verifique se o serviço está disponível.";
    this.statusCode = 503;
    this.context = context;
  }

  toJSON() {
    return serializeError(this, { cause: this.cause?.toJSON?.() });
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
    return serializeError(this, { cause: this.cause?.toJSON?.() });
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
    return serializeError(this, { cause: this.cause?.toJSON?.() });
  }
}

class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Você não possui permissão para executar esta ação.", {
      cause,
    });
    this.name = "ForbiddenError";
    this.action =
      action || "Verifique as features necessárias para executar esta ação.";
    this.statusCode = 403;
  }

  toJSON() {
    return serializeError(this, { cause: this.cause?.toJSON?.() });
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
    return serializeError(this);
  }
}

export {
  InternalServerError,
  MethodNotAllowedError,
  ServiceError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AuthenticationError,
};
