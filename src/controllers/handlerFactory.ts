import { NextFunction, Request, Response } from 'express';
import { Model } from 'mongoose';

import AppError from '../utils/appError';
import asyncWrapper from '../utils/asyncWrapper';

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

export const getOne = <ModelInterface>(ModelEntity: Model<ModelInterface>) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const entity: ModelInterface[] | null = await ModelEntity.findById(
        req.params.id
      );

      if (!entity) {
        return next(new AppError('No entity found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: entity,
      });
    }
  );

export const updateOne = <ModelInterface>(ModelEntity: Model<ModelInterface>) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const updatedEntity: ModelInterface[] | null =
        await ModelEntity.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });

      if (!updatedEntity) {
        return next(new AppError('No entity found with that ID', 404));
      }

      res.status(201).json({
        status: 'success',
        data: updatedEntity,
      });
    }
  );

export const deleteOne = <ModelInterface>(ModelEntity: Model<ModelInterface>) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const removedEntity: ModelInterface[] | null =
        await ModelEntity.findByIdAndDelete(req.params.id);

      if (!removedEntity) {
        return next(new AppError('No entity found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  );

export const getAllEntities = <ModelInterface>(
  ModelEntity: Model<ModelInterface>
) =>
  asyncWrapper(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const entities: ModelInterface[] = await ModelEntity.find();
      res.status(200).json({
        status: 'success',
        results: entities.length,
        data: entities,
      });
    }
  );
