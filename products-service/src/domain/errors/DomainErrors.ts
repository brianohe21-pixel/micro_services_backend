export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product with id ${productId} not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class DatabaseError extends DomainError {
  constructor(message: string) {
    super(`Database error: ${message}`);
  }
}
