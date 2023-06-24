import { NextFunction, Request, Response, CookieOptions } from 'express';
import jwt, { JwtPayload, VerifyOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';

import User, { IUser, UserRoles } from '../models/userModel';
import asyncWrapper from '../utils/asyncWrapper';
import Email from '../utils/email';
import AppError from '../utils/appError';
import { IRequestWithUser } from '../types/request';
import { DAY_IN_MILLISECONDS, RuntimeEnv, JWT_COOKIE } from '../constants';

const signToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as Secret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (
  user: IUser,
  statusCode: number,
  res: Response
): void => {
  const token = signToken(user._id);
  const cookieOptions: CookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '9', 10) *
          DAY_IN_MILLISECONDS
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === RuntimeEnv.PRODUCTION)
    cookieOptions.secure = true;

  res.cookie(JWT_COOKIE, token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const signUp = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
  }
);

const login = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }
    const user = await User.findOne({ email }).select('+password');

    if (
      !user ||
      !(await user.schema.methods.isCorrectPassword(password, user.password))
    ) {
      throw new AppError('Incorrect email or password', 401);
    }

    createSendToken(user, 200, res);
  }
);

const logout = (req: Request, res: Response): void => {
  res.cookie(JWT_COOKIE, 'loggedout', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

const updatePassword = asyncWrapper(
  async (
    req: IRequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = await User.findById(req.user!.id).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    const correct = await user.schema.methods.isCorrectPassword(
      currentPassword,
      user.password
    );

    if (!correct) {
      throw new AppError('Incorrect password', 401);
    }

    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;

    await user.save();

    createSendToken(user, 200, res);
  }
);

const forgotPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw new AppError('There is no user with email.', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    try {
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/reset-password/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500
        )
      );
    }
  }
);

const resetPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res);
  }
);

const protect = asyncWrapper(
  async (
    req: IRequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let token: string | undefined;

    if (req.cookies && req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
      token = req.cookies.jwt;
    }
    if (!token) {
      throw new AppError(
        'You are not logged in! Please log in to get access.',
        401
      );
    }

    const decodedPayload = await promisify<
      string,
      Secret,
      VerifyOptions,
      JwtPayload & IUser
    >(jwt.verify)(token, process.env.JWT_SECRET as Secret, {});

    const currentUser = await User.findById(decodedPayload.id);

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }

    if (currentUser.schema.methods.changedPasswordAfter(decodedPayload.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

const restrictTo = (...roles: UserRoles[]) => {
  return (req: IRequestWithUser, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user!.role as UserRoles)) {
      throw new AppError(
        'You do not have permission to perform this action',
        403
      );
    }
    next();
  };
};

const authController = {
  signUp,
  login,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
  restrictTo,
  protect,
};

export default authController;
