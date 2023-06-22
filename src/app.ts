import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import trackRouter from './routes/trackRoutes';
import userRouter from './routes/userRoutes';

import AppError from './utils/appError'
import globalErrorHandler from './controllers/errorController'

// Start express app
const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Routes
app.use('/api/v1/tracks', trackRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler)

export default app;
