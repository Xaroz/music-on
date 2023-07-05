import { ModelErrorEnum } from '../constants/error';
import { Document, model, Query, Schema } from 'mongoose';

import { validateDuplicateData } from '../utils/requestValidation';

export interface IPlaylist extends Document {
  name: string;
  description: string;
  public: boolean;
  tracks: Array<Schema.Types.ObjectId>;
  createdBy: Schema.Types.ObjectId;
}

const playlistSchema: Schema<IPlaylist> = new Schema(
  {
    name: {
      type: String,
      required: [true, ModelErrorEnum.REQUIRED_NAME],
    },
    description: {
      type: String,
      required: [true, ModelErrorEnum.REQUIRED_DESCRIPTION],
      minlength: [5, 'Atleast 5 characters are required for description'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Playlist must have an owner'],
    },
    tracks: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Track',
        },
      ],
      validate: {
        validator: function (tracks: Array<Schema.Types.ObjectId>) {
          return validateDuplicateData(tracks);
        },
        message: 'Tracks must be unique',
      },
    },
    public: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Query Middleware

const populateFind = function <T extends Document>(this: Query<T[], T>) {
  this.populate({
    path: 'tracks createdBy',
    // This is not working for some reason
    // select: '-__v',
  });
};

const populateFindOne = function <T extends Document>(this: Query<T[], T>) {
  this.populate({
    path: 'tracks',
    // This is not working for some reason
    // select: '-__v',
  });
};

playlistSchema.pre('find', populateFind);
playlistSchema.pre('findOne', populateFindOne);

const Playlist = model<IPlaylist>('Playlist', playlistSchema);

export default Playlist;
