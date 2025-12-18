export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 500, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("bad_request", message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("unauthorized", message, 401, details);
  }
}

export class OutOfScopeError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("out_of_scope", message, 200, details);
  }
}

export class SafetyRefusalError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("safety_refusal", message, 200, details);
  }
}


