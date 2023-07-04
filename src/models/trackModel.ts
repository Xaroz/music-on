import { Document, model, Schema, Query } from 'mongoose';

export interface ITrack extends Document {
  name: string;
  coverImage: string;
  url: string;
  releaseDate: Date;
  artists: Array<Schema.Types.ObjectId>;
  genres: Array<Schema.Types.ObjectId>;
  createdBy: Schema.Types.ObjectId;
}

const trackSchema: Schema<ITrack> = new Schema(
  {
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
    artists: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      required: [true, 'Artists are required'],
      min: [1, 'At least one artist is required'],
    },
    genres: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Genre',
        },
      ],
      required: [true, 'Genres are required'],
      min: [1, 'At least one genre is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Query Middleware

const populateGenresAndUsers = function <T extends Document>(
  this: Query<T[], T>
) {
  this.populate({
    path: 'genres artists createdBy',
    // This is not working for some reason
    // select: '-__v',
  });
};

trackSchema.pre('find', populateGenresAndUsers);
trackSchema.pre('findOne', populateGenresAndUsers);

const Track = model<ITrack>('Track', trackSchema);

export default Track;
