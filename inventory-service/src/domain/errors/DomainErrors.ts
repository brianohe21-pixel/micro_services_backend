export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InventoryNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Inventory for product ${productId} not found`);
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

export class ServiceUnavailableError extends DomainError {
  constructor(serviceName: string = 'External service') {
    super(`${serviceName} is currently unavailable`);
  }
}

export class TimeoutError extends DomainError {
  constructor(serviceName: string = 'External service') {
    super(`Request to ${serviceName} timed out`);
  }
}

export class InsufficientInventoryError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient inventory for product ${productId}: requested ${requested}, available ${available}`);
  }
}
