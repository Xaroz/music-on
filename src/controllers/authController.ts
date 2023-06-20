import { NextFunction, Request, Response, CookieOptions } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

import User, { IUser } from '../models/userModel';
import asyncWrapper from '../utils/asyncWrapper';
import AppError from '../utils/appError';
import {IRequestWithUser} from '../types/request';


const signToken = (id: string): string => {

  return jwt.sign({ id }, process.env.JWT_SECRET as Secret, {
    expiresIn: process.env.JWT_COOKIE_EXPIRES_IN,
  });
}

const createSendToken = (user: IUser, statusCode: number, res: Response): void => {
  const token = signToken(user._id);
  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '9', 10) * 24 * 60 * 60 * 1000)),
    httpOnly: true,
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    }
  })
}


const signUp = asyncWrapper(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, passwordConfirm } = req.body;
  if (!name || !email || !password || !passwordConfirm) {
    return next(new AppError('Please provide email and password', 400));
  }

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res);
})

const login = asyncWrapper(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.schema.methods.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  createSendToken(user, 200, res);
})

const logout = (req: Request, res: Response): void => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + (10 * 1000)),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
}

const restrictTo = (...roles: string[]) => {
  return (req: IRequestWithUser, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  }
}

const authController = {
  signUp,
  login,
  logout,
  restrictTo
}

export default authController