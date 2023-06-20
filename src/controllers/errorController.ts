import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/appError'

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

const handleInvalidTokenSignature = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleExpiredToken = () =>
  new AppError('Token has expired. Please log in again!', 401);


const handleDuplicateFieldsDB = (err: any) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: '${value}'. Please use another value!`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}

const sendErrorDev = (err: any, req: Request, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err: any, res: Response) => {
  if(err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  }
  console.error('ERROR 💥', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
}

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  
  if(process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, req, res);
  }

  let error = JSON.parse(JSON.stringify(err));

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleInvalidTokenSignature();
  if (error.name === 'TokenExpiredError') error = handleExpiredToken();
  
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  sendErrorProd(error, res);
}