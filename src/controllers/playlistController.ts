import { NextFunction, Response } from 'express';

import {
  createOne,
  deleteOne,
  getAllEntities,
  getOne,
  updateOne,
} from './handlerFactory';

import Playlist, { IPlaylist } from '../models/playlistModel';
import Track, { ITrack } from '../models/trackModel';
import { UserRoles } from '../models/userModel';

import { IRequestWithUser } from '../types/request';

import asyncWrapper from '../utils/asyncWrapper';

import AppError from '../utils/appError';
import { validateEntitiesExistence } from '../utils/requestValidation';

const createPlaylist = createOne<IPlaylist>(Playlist);

const getAllPlaylists = getAllEntities<IPlaylist>(Playlist, true);

const getPlaylist = getOne<IPlaylist>(Playlist, true);

const updatePlaylist = updateOne<IPlaylist>(Playlist, true);

const deletePlaylist = deleteOne<IPlaylist>(Playlist, true);

const checkTrackExistence = asyncWrapper(
  async (
    req: IRequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { trackId } = req.params;
    const trackExists = await validateEntitiesExistence<ITrack>(Track, [
      trackId,
    ]);
    if (!trackExists) return next(new AppError('Track not found', 400));

    // emptying body so no other fields can be updated
    req.body = {};
    next();
  }
);

const addTrack = asyncWrapper(
  async (
    req: IRequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    await updateOne<IPlaylist>(Playlist, true, {
      $addToSet: { tracks: req.params.trackId },
    })(req, res, next);
  }
);

const removeTrack = asyncWrapper(
  async (
    req: IRequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    await updateOne<IPlaylist>(Playlist, true, {
      $pull: { tracks: req.params.trackId },
    })(req, res, next);
  }
);

const PlaylistController = {
  createPlaylist,
  getAllPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrack,
  removeTrack,
  checkTrackExistence,
};

export default PlaylistController;
