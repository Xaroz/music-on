import mongoose, { Document } from 'mongoose';
import isEmail from 'validator/lib/isEmail';

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  createdAt: Date;
  password: string;
  passwordConfirm: string;
  passwordChangedAt: Date;
  passwordResetToken: string;
  passwordResetExpires: Date;
  active: boolean;
  type: string;
}

const userSchema = new mongoose.Schema({
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
    //     return value === this.get('password');
    //   },
    //   message: 'Passwords are not the same!',
    // } 
    // This keeps throwing an error. that this is not a function. I don't know why TS doesn't recognize this value of a document
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  type: {
    type: String,
    enum: ['user', 'artist', 'admin'],
    default: 'user',
  },
});

userSchema.pre<IUser>("save", function(next) {
  // Unlike in the validator function, here this points to the document that is about to be saved
  if(!this.isModified("password")) return next();
  // So we can check if the password and passwordConfirm are the same
  if(this.password !== this.passwordConfirm) {
    return next(new Error("Passwords are not the same!"));
  }
  next();
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;