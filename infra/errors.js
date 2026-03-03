export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno do servidor ocorreu.", { cause });
    this.name = "InternalServerError";
    this.action = "Se o problema persistir, entre em contato com o suporte.";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
      cause: this.cause.toJSON(),
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido.");
    this.name = "MethodNotAllowedError";
    this.action = "Use um método HTTP válido para o endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message || "Ocorreu um erro ao executar o serviço.", { cause });
    this.name = "ServiceError";
    this.action = "Verifique se o serviço está disponível.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Ocorreu um erro de validação.", { cause });
    this.name = "ValidationError";
    this.action = action || "Verifique se os dados fornecidos são válidos.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
    };
  }
}
