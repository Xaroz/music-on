import express from 'express';
import morgan from 'morgan';

import trackRouter from './routes/trackRoutes';
import userRouter from './routes/userRoutes';

// Start express app
const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(cookieParser());

// Routes
app.use('/api/v1/tracks', trackRouter);
app.use('/api/v1/users', userRouter);

export default app;
