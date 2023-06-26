import { Model, Document, model, Schema } from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export enum UserRoles {
  ADMIN = 'admin',
  ARTIST = 'artist',
  USER = 'user',
}

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  createdAt: Date;
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active: boolean;
  role: UserRoles;
}

interface IUserMethods {
  isCorrectPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

export interface UserModel extends Model<IUser, {}, IUserMethods> {
  // Build static methods here
}

const schema = new Schema<IUser, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email!'],
  },
  photo: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  password: {
    type: String,
    required: [true, 'Please provide a password!'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    enum: UserRoles,
    default: UserRoles.USER,
  },
});

// ==================Middleware==================

schema.pre<IUser>('save', function (next) {
  // Unlike in the validator function, here this points to the document that is about to be saved
  if (!this.isModified('password')) return next();
  // So we can check if the password and passwordConfirm are the same
  if (this.password !== this.passwordConfirm) {
    return next(new Error('Passwords are not the same!'));
  }
  next();
});

schema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password!, 12);
  this.passwordConfirm = undefined;
  next();
});

schema.pre<IUser>('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

//==================Instance methods==================

schema.methods.isCorrectPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

schema.methods.changedPasswordAfter = function (JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

schema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 60 * 1000);
  return resetToken;
};

const User = model<IUser, UserModel>('User', schema);

export default User;
