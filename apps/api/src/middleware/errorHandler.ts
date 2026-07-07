import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError, ValidationError } from '../types/errors.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let status = 'error';
  let message = 'Internal server error';
  let errors: any = undefined;

  // Log error details
  console.error('💥 Error handler caught:', err);

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.status;
    message = err.message;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    status = 'fail';
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err.constructor.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    status = 'fail';
    message = 'Database operation failed';
  }

  res.status(statusCode).json({
    status,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
