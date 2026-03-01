export class InternalServerError extends Error {
  constructor({ cause }) {
    super("Um erro interno do servidor ocorreu.", { cause });
    this.name = "InternalServerError";
    this.action = "Se o problema persistir, entre em contato com o suporte.";
    this.statusCode = 500;
  }

  toJSON() {
    return {
      name: this.name,
      status_code: this.statusCode,
      message: this.message,
      action: this.action,
      cause: {
        name: this.cause.name,
        message: this.cause.message,
        code: this.cause.code,
      },
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
