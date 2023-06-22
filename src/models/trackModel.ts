import mongoose, { Document, Schema } from 'mongoose';

export interface ITrack extends Document {
  name: string;
  coverImage: string;
  url: string;
  releaseDate: Date;
  createdAt: Date;
  artists: Array<string>;
}

const trackSchema: Schema<ITrack> = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: [4, 'Minimum length is 4'],
  },
  coverImage: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  releaseDate: {
    type: Date,
    default: Date.now(),
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  artists: [
    {
      type: String,
      required: true,
    },
  ],
});

export default mongoose.model<ITrack>('Track', trackSchema);
