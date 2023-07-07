import { Document, Model, Schema } from 'mongoose';

import { Visibility } from '../controllers/handlerFactory';

import { IUser, UserRoles } from '../models/userModel';

/**
 * Check if the values actually exists within the model
 * given
 */
export const validateEntitiesExistence = async <ModelInterface>(
  ModelEntity: Model<ModelInterface>,
  values: string[]
) => {
  const existingDocuments = await ModelEntity.find({
    _id: { $in: values },
  });

  return existingDocuments.length === values.length;
};

/**
 * Check if the array of given IDs have any duplicates
 */
export const validateDuplicateData = (values: Array<Schema.Types.ObjectId>) => {
  const uniqueValues = [...new Set(values.map((value) => value.toString()))];

  return uniqueValues.length === values.length;
};

/**
 * Checks if the current user is the creator of the document
 */
export const checkDocumentOwner = <
  ModelInterface extends Document & Visibility
>(
  document: ModelInterface,
  user?: IUser
) => {
  const { createdBy } = document;
  if (!user || !createdBy) return false;

  if (user.role === UserRoles.ADMIN) return true;

  if ('email' in createdBy) {
    return user.id === createdBy.id.toString();
  }

  return createdBy.toString() === user.id;
};
