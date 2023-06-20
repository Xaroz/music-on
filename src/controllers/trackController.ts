import { NextFunction, Request, Response } from 'express';
import { Error } from 'mongoose';
import multer from 'multer';

import Track, { ITrack } from '../models/trackModel';

import AppError from '../utils/appError';
import asyncWrapper from '../utils/asyncWrapper';
import { isNonNullable } from '../utils/base';
import { getS3Params, uploadFilesToS3 } from '../utils/uploadFile';

const getErrorMessage = (
  errors: Array<Error.ValidationError | null>
): Array<Error.ValidationError> => {
  return errors.filter(isNonNullable);
};

const multerUploadFields = multer({ limits: {} }).fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'url', maxCount: 1 },
]);

const validateBeforeUpload = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, artists } = req.body;

    if (!name || !artists) {
      return next(new AppError('Name or artists are required', 400));
    }

    const track = new Track({ name, artists });
    const nameValidationError = track.validateSync('name');
    const emailValidationError = track.validateSync('email');

    const errors = getErrorMessage([nameValidationError, emailValidationError]);

    if (errors.length > 0) {
      res.status(400).json({ status: 'fail', error: errors });
      return;
    }

    next();
  }
);

const validateFiles = (
  coverImage: Express.Multer.File | undefined,
  url: Express.Multer.File | undefined,
  next: NextFunction
) => {
  if (coverImage) {
    if (!coverImage.mimetype.startsWith('image/'))
      return next(new AppError('coverImage must be an image file', 400));

    if (coverImage.size > 5 * 1024 * 1024)
      return next(new AppError('coverImage size must not exceed 5MB', 400));
  }

  if (url) {
    if (!url.mimetype.startsWith('audio/'))
      return next(new AppError('url must be an audio file', 400));

    if (url.size > 15 * 1024 * 1024)
      return next(new AppError('url size must not exceed 15MB', 400));
  }
};

const uploadCreateToS3 = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const coverImage = files?.coverImage ? files?.coverImage[0] : undefined;
    const url = files?.url ? files?.url[0] : undefined;

    if (!coverImage || !url)
      return next(new AppError('coverImage or url must be defined', 400));

    validateFiles(coverImage, url, next);

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

    validateFiles(coverImage, url, next);

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

const createTrack = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const track: ITrack = await Track.create(req.body);

    res.status(201).json({
      status: 'success',
      data: track,
    });
  }
);

const getAllTracks = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const tracks: ITrack[] = await Track.find();
    res.status(200).json({
      status: 'success',
      results: tracks.length,
      data: tracks,
    });
  }
);

const getTrack = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const track: ITrack[] | null = await Track.findById(req.params.id);

    if (!track) {
      return next(new AppError('No track found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: track,
    });
  }
);

const updateTrack = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const updatedTrack: ITrack[] | null = await Track.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTrack) {
      return next(new AppError('No track found with that ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: updatedTrack,
    });
  }
);

const deleteTrack = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const removedTrack: ITrack[] | null = await Track.findByIdAndDelete(
      req.params.id
    );

    if (!removedTrack) {
      return next(new AppError('No track found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

const trackController = {
  createTrack,
  getAllTracks,
  getTrack,
  updateTrack,
  deleteTrack,
  validateBeforeUpload,
  uploadCreateToS3,
  uploadPatchToS3,
  multerUploadFields,
};

export default trackController;
