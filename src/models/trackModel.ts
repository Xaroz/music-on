import { Document, model, Schema, Query } from 'mongoose';

export interface ITrack extends Document {
  name: string;
  coverImage: string;
  url: string;
  releaseDate: Date;
  createdAt: Date;
  artists: Array<Schema.Types.ObjectId>;
  genres: Array<Schema.Types.ObjectId>;
}

const trackSchema: Schema<ITrack> = new Schema({
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
  artists: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    required: [true, 'Artists are required'],
    min: [1, 'Atleast one artist is required'],
  },
  genres: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    required: [true, 'Genres are required'],
    min: [1, 'Atleast one genre is required'],
  },
});

// Query Middleware

const populateGenresAndArtists = function <T extends Document>(
  this: Query<T[], T>
) {
  this.populate({
    path: 'genres artists',
    // This is not working for some reason
    // select: '-__v',
  });
};

trackSchema.pre('find', populateGenresAndArtists);
trackSchema.pre('findOne', populateGenresAndArtists);

const Track = model<ITrack>('Track', trackSchema);

export default Track;
