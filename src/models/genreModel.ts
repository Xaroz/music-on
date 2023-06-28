import { ModelErrorEnum } from '../constants/error';
import { Document, model, Schema } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  description: string;
  createdAt: Date;
}

const genreSchema: Schema<IGenre> = new Schema({
  name: {
    type: String,
    required: [true, ModelErrorEnum.REQUIRED_NAME],
  },
  description: {
    type: String,
    required: [true, ModelErrorEnum.REQUIRED_DESCRIPTION],
    minlength: [5, 'Atleast 5 characters are required for description'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

const Genre = model<IGenre>('Genre', genreSchema);

export default Genre;
