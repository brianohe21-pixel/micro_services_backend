import { Request, Response, NextFunction } from 'express';
import { ProductNotFoundError, ValidationError, DatabaseError } from '../../domain/errors/DomainErrors';
import { logger } from '../logging/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof ProductNotFoundError) {
    res.status(404).json({
      errors: [{
        status: '404',
        title: 'Not Found',
        detail: error.message
      }]
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json({
      errors: [{
        status: '400',
        title: 'Bad Request',
        detail: error.message
      }]
    });
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(500).json({
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: 'A database error occurred'
      }]
    });
    return;
  }

  res.status(500).json({
    errors: [{
      status: '500',
      title: 'Internal Server Error',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    }]
  });
};
