import { ModelErrorEnum } from '../constants/error';
import { Document, model, Schema } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  description: string;
}

const genreSchema: Schema<IGenre> = new Schema(
  {
    name: {
      type: String,
      required: [true, ModelErrorEnum.REQUIRED_NAME],
    },
    description: {
      type: String,
      required: [true, ModelErrorEnum.REQUIRED_DESCRIPTION],
      minlength: [5, 'At least 5 characters are required for description'],
    },
  },
  {
    timestamps: true,
  }
);

const Genre = model<IGenre>('Genre', genreSchema);

export default Genre;
