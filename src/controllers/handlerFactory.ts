import { NextFunction, Request, Response } from 'express';
import { Document, FilterQuery, Model, Schema, UpdateQuery } from 'mongoose';

import { IUser, UserRoles } from '../models/userModel';

import { IRequestWithUser } from '../types/request';

import { checkDocumentOwner } from '../utils/requestValidation';

import AppError from '../utils/appError';
import asyncWrapper from '../utils/asyncWrapper';

export interface Visibility {
  createdBy?: Schema.Types.ObjectId | IUser;
  public?: boolean;
}

export const createOne = <ModelInterface>(ModelEntity: Model<ModelInterface>) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const entity: ModelInterface = await ModelEntity.create(req.body);

      res.status(201).json({
        status: 'success',
        data: entity,
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
      let entity: ModelInterface | null = await ModelEntity.findById(
        req.params.id
      );

      if (!entity) {
        return next(new AppError('No entity found with that ID', 404));
      }

      if (checkVisibility && entity.createdBy) {
        if (
          req.user?.role !== UserRoles.ADMIN &&
          req.user?.id !== entity.createdBy.toString() &&
          entity.public === false
        ) {
          return next(new AppError('No entity found with that ID', 404));
        } else entity = await entity.populate('createdBy');
      }

      res.status(200).json({
        status: 'success',
        data: entity,
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
        return next(new AppError('No entity found with that ID ', 404));
      }

      if (checkOwnership) {
        const isOwner = checkDocumentOwner(document, req.user);

        if (!isOwner)
          return next(
            new AppError('You are not authorized to update this document', 401)
          );
      }

      const updateDocument = document.updateOne(
        { ...req.body, updateQuery },
        { runValidators: true, new: true }
      );

      res.status(201).json({
        status: 'success',
        data: updateDocument,
      });
    }
  );

export const deleteOne = <ModelInterface>(
  ModelEntity: Model<ModelInterface>,
  checkOwnership?: boolean
) =>
  asyncWrapper(
    async (
      req: IRequestWithUser,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const removedEntity: ModelInterface[] | null =
        await ModelEntity.findOneAndDelete({
          _id: req.params.id,
          ...(checkOwnership &&
            req.user?.role !== UserRoles.ADMIN && {
              createdBy: req.user?.id,
            }),
        });

      if (!removedEntity) {
        return next(
          new AppError(
            'No entity found with that ID or you are not authorized to delete it',
            404
          )
        );
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  );

export const getAllEntities = <ModelInterface>(
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

      const entities: ModelInterface[] = await ModelEntity.find(filters);

      res.status(200).json({
        status: 'success',
        results: entities.length,
        data: entities,
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
