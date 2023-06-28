import { NextFunction, Request, Response } from 'express';
import mongoose, { Error } from 'mongoose';
import multer from 'multer';

import Genre, { IGenre } from '../models/genreModel';
import Track, { ITrack } from '../models/trackModel';
import User, { IUser } from '../models/userModel';

import {
  getOne,
  createOne,
  updateOne,
  deleteOne,
  getAllEntities,
} from '../controllers/handlerFactory';

import {
  MAX_AUDIO_FILE_SIZE,
  MAX_IMAGE_FILE_SIZE,
} from '../constants/fileSize';

import { IRequestWithUser } from '../types/request';

import AppError from '../utils/appError';
import asyncWrapper from '../utils/asyncWrapper';
import { isNonNullable } from '../utils/base';
import { getS3Params, uploadFilesToS3 } from '../utils/uploadFile';
import { validateFile } from '../utils/validateFile';
import { validateEntitiesExistence } from '../utils/requestValidation';

const getErrorMessage = (
  errors: Array<Error.ValidationError | null>
): Array<Error.ValidationError> => {
  return errors.filter(isNonNullable);
};

const multerUploadFields = multer().fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'url', maxCount: 1 },
]);

const validateBeforeUpload = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, genres, artists } = req.body;

    if (!name || !genres || !artists) {
      return next(new AppError('Name, genres or artists are required', 400));
    }

    const track = new Track({ name, artists, genres });
    const nameValidationError = track.validateSync('name');
    const artistsValidationError = track.validateSync('artists');
    const genresValidationError = track.validateSync('genres');

    const errors = getErrorMessage([
      nameValidationError,
      artistsValidationError,
      genresValidationError,
    ]);

    if (errors.length > 0) {
      res.status(400).json({ status: 'fail', error: errors });
      return;
    }

    next();
  }
);

const validateDataExistence = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const { genres, artists } = req.body;

    if (genres) {
      const genresExist = await validateEntitiesExistence<IGenre>(
        Genre,
        genres
      );
      if (!genresExist) return next(new AppError('Genres not found', 400));
    }

    if (artists) {
      const artistsExist = await validateEntitiesExistence<IUser>(
        User,
        artists
      );
      if (!artistsExist) return next(new AppError('Artists not found', 400));
    }

    next();
  }
);

const uploadCreateToS3 = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const coverImage = files?.coverImage ? files?.coverImage[0] : undefined;
    const url = files?.url ? files?.url[0] : undefined;

    console.log('hit this route');

    if (!coverImage || !url)
      return next(new AppError('coverImage or url must be defined', 400));

    const coverImageValidationError = validateFile(
      coverImage,
      'image/',
      MAX_IMAGE_FILE_SIZE
    );
    if (coverImageValidationError) return next(coverImageValidationError);

    const urlValidationError = validateFile(url, 'audio/', MAX_AUDIO_FILE_SIZE);
    if (urlValidationError) return next(urlValidationError);

    const coverImageParams = getS3Params(coverImage);
    const urlParams = getS3Params(url);

    const data = await uploadFilesToS3([coverImageParams, urlParams]);
    if (!data) {
      return next(new AppError('Error uploading files', 500));
    }

    req.body.coverImage = data[0].Location;
    req.body.url = data[1].Location;

    next();
  }
);

const uploadPatchToS3 = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const coverImage = files?.coverImage ? files?.coverImage[0] : undefined;
    const url = files?.url ? files?.url[0] : undefined;

    if (!coverImage && !url) return next();

    const coverImageValidationError = validateFile(
      coverImage,
      'image/',
      MAX_IMAGE_FILE_SIZE
    );
    if (coverImageValidationError) return next(coverImageValidationError);

    const urlValidationError = validateFile(url, 'audio/', MAX_AUDIO_FILE_SIZE);
    if (urlValidationError) return next(urlValidationError);

    const coverImageData = coverImage
      ? await uploadFilesToS3([getS3Params(coverImage)])
      : undefined;
    const urlData = url ? await uploadFilesToS3([getS3Params(url)]) : undefined;

    req.body.coverImage = coverImageData
      ? coverImageData[0].Location
      : undefined;
    req.body.url = urlData ? urlData[0].Location : undefined;

    next();
  }
);

const createTrack = createOne<ITrack>(Track);

const getAllTracks = getAllEntities<ITrack>(Track);

const getTrack = getOne<ITrack>(Track);

const updateTrack = updateOne<ITrack>(Track);

const deleteTrack = deleteOne<ITrack>(Track);

const trackController = {
  createTrack,
  getAllTracks,
  getTrack,
  updateTrack,
  deleteTrack,
  validateBeforeUpload,
  validateDataExistence,
  uploadCreateToS3,
  uploadPatchToS3,
  multerUploadFields,
};

export default trackController;
