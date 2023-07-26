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
import {
  getS3Params,
  removesFilesFromS3,
  uploadFilesToS3,
} from '../utils/fileManager';
import { validateFile } from '../utils/validateFile';
import {
  checkDocumentOwner,
  validateEntitiesExistence,
} from '../utils/requestValidation';

const getErrorMessage = (
  errors: Array<Error.ValidationError | null>
): Array<Error.ValidationError> => {
  return errors.filter(isNonNullable);
};

const multerUploadFields = multer().fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'url', maxCount: 1 },
]);

// Since we are using form-data we have to make sure that the value is
// an array otherwise just convert it to one
const convertToArray = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    let { genres, artists } = req.body;

    if (genres) {
      if (!Array.isArray(genres)) req.body.genres = [genres];
    }

    if (artists) {
      if (!Array.isArray(artists)) req.body.artists = [artists];
    }

    next();
  }
);

const validateBeforeUpload = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
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
    let { genres, artists } = req.body;

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

const checkTrackOwner = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const track = await Track.findById(req.params.id);

    if (!track) {
      return next(new AppError('No Track found with that ID ', 404));
    }

    const isOwner = checkDocumentOwner(track, req.user);

    if (!isOwner)
      return next(
        new AppError('You are not authorized to update this document', 401)
      );

    req.track = track;

    next();
  }
);

const createTrack = createOne<ITrack>(Track);

const getAllTracks = getAllEntities<ITrack>(Track);

const getTrack = getOne<ITrack>(Track);

const updateTrack = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const updatedTrack = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      { runValidators: true, new: true }
    );

    res.status(201).json({
      status: 'success',
      data: updatedTrack,
    });

    // Deleting old files from AWS S3

    let deleteUrls: string[] = [];
    const track = req.track;

    if (req.body.coverImage && track) deleteUrls.push(track.coverImage);
    if (req.body.url && track) deleteUrls.push(track.url);

    if (deleteUrls.length > 0) await removesFilesFromS3(deleteUrls);
  }
);

const deleteTrack = asyncWrapper(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    await Track.findByIdAndRemove(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });

    // Deleting old files from AWS S3

    const track = req.track;
    if (track) await removesFilesFromS3([track.coverImage, track.url]);
  }
);

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
  convertToArray,
  checkTrackOwner,
};

export default trackController;
