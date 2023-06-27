import { ModelErrorEnum } from 'constants/error';
import mongoose, { Document, Schema } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  description: string;
  createdAt: Date;
}

const genreSchema: Schema<IGenre> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, ModelErrorEnum.REQUIRED_NAME],
  },
  description: {
    type: String,
    required: [true, ModelErrorEnum.DESCRIPTION_NAME],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

export default mongoose.model<IGenre>('Genre', genreSchema);
