import { Model, Document, model, Schema } from 'mongoose';
import isEmail from 'validator/lib/isEmail';
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  createdAt: Date;
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt: Date;
  passwordResetToken: string;
  passwordResetExpires: Date;
  active: boolean;
  role: string;
}

interface IUserMethods extends Model<IUser> {
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}

type UserModel = Model<IUser> & IUserMethods;


const userSchema = new Schema<IUser, UserModel>({
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
    // validate: {
    //   validator: function (value: string): boolean {
    //     return value === this.password;
    //     return value === this.get('password');
    //   },
    //   message: 'Passwords are not the same!',
    // } 
    // This keeps throwing an error. that this is not a function. I don't know why TS doesn't recognize this value being a document, tried using the get method but it still doesn't work
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
    enum: ['user', 'artist', 'admin'],
    default: 'user',
  },
});

// ==================Middleware==================

userSchema.pre<IUser>("save", function(next) {
  // Unlike in the validator function, here this points to the document that is about to be saved
  if(!this.isModified("password")) return next();
  // So we can check if the password and passwordConfirm are the same
  if(this.password !== this.passwordConfirm) {
    return next(new Error("Passwords are not the same!"));
  }
  next();
});

userSchema.pre<IUser>("save", async function(next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password!, 12);
  this.passwordConfirm = undefined;
  next();
})

userSchema.pre<IUser>("save", function(next) {
  if(!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

//==================Instance methods==================

userSchema.methods.correctPassword = async function(candidatePassword: string, userPassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if(this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }
  return false;
}

const User = model<IUser, UserModel>('User', userSchema);

export default User;