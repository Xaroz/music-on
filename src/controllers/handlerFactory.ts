import { NextFunction, Request, Response } from 'express';
import { Document, FilterQuery, Model, Schema, UpdateQuery } from 'mongoose';

import { IRequestWithUser, Visibility } from '../types/request';

import {
  checkDocumentOwner,
  checkDocumentVisibility,
} from '../utils/requestValidation';

import AppError from '../utils/appError';
import APIFeatures, { RequestQueryString } from '../utils/apiFeatures';
import asyncWrapper from '../utils/asyncWrapper';

export const createOne = <ModelInterface>(ModelEntity: Model<ModelInterface>) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const document: ModelInterface = await ModelEntity.create(req.body);

      res.status(201).json({
        status: 'success',
        data: document,
      });
    }
  );

export const getOne = <ModelInterface extends Document & Visibility>(
  ModelEntity: Model<ModelInterface>,
  checkVisibility?: boolean
) =>
  asyncWrapper(
    async (
      req: IRequestWithUser,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      let document: ModelInterface | null = await ModelEntity.findById(
        req.params.id
      );

      if (!document) {
        return next(new AppError('No document found with that ID', 404));
      }

      if (checkVisibility && document.createdBy) {
        const isDocumentVisible = checkDocumentVisibility(document, req.user);

        if (!isDocumentVisible)
          return next(
            new AppError('You are not authorized to view this document', 401)
          );
      }

      res.status(200).json({
        status: 'success',
        data: document,
      });
    }
  );

export const updateOne = <ModelInterface extends Document & Visibility>(
  ModelEntity: Model<ModelInterface>,
  checkOwnership?: boolean,
  updateQuery?: UpdateQuery<ModelInterface> | undefined
) =>
  asyncWrapper(
    async (
      req: IRequestWithUser,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const document: ModelInterface | null = await ModelEntity.findById(
        req.params.id
      );

      if (!document) {
        return next(new AppError('No document found with that ID ', 404));
      }

      if (checkOwnership) {
        const isOwner = checkDocumentOwner(document, req.user);

        if (!isOwner)
          return next(
            new AppError('You are not authorized to update this document', 401)
          );
      }

      const updatedDocument = await ModelEntity.findByIdAndUpdate(
        req.params.id,
        { ...req.body, ...updateQuery },
        { runValidators: true, new: true }
      );

      res.status(201).json({
        status: 'success',
        data: updatedDocument,
      });
    }
  );

export const deleteOne = <ModelInterface extends Document & Visibility>(
  ModelEntity: Model<ModelInterface>,
  checkOwnership?: boolean
) =>
  asyncWrapper(
    async (
      req: IRequestWithUser,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const document: ModelInterface | null = await ModelEntity.findById(
        req.params.id
      );

      if (!document) {
        return next(new AppError('No document found with that ID', 404));
      }

      if (checkOwnership) {
        const isOwner = checkDocumentOwner(document, req.user);

        if (!isOwner)
          return next(
            new AppError('You are not authorized to delete this document', 401)
          );
      }

      await document.deleteOne();

      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  );

export const getAllEntities = <ModelInterface extends Document & Visibility>(
  ModelEntity: Model<ModelInterface>,
  checkVisibility?: boolean
) =>
  asyncWrapper(
    async (
      req: IRequestWithUser,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      let filters: FilterQuery<ModelInterface> | undefined = checkVisibility
        ? {
            $or: [
              {
                createdBy: req.user?.id,
              },
              { public: true },
            ],
          }
        : {};
      const query = req.query as RequestQueryString;

      const features = new APIFeatures(ModelEntity, query)
        .search()
        .filter()
        .sort()
        .select()
        .paginate();

      const documents: ModelInterface[] = await features.query;
      const totalDocuments = await ModelEntity.countDocuments(
        features.query.getFilter()
      );

      res.status(200).json({
        status: 'success',
        results: documents.length,
        total: totalDocuments,
        data: documents,
      });
    }
  );

const handlerFactory = {
  createOne,
  getOne,
  updateOne,
  deleteOne,
  getAllEntities,
};

export default handlerFactory;
