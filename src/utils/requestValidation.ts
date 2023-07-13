import { Document, Model, Schema } from 'mongoose';

import { IUser, UserRoles } from '../models/userModel';

import { Visibility } from '../types/request';

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
 * Checks if the current user is the creator of the document.
 * Always returns true if current user is an admin
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

/**
 * Returns `true` if current user is an admin or the owner of the document.
 * Otherwise returns `true` only if document is public
 */
export const checkDocumentVisibility = <
  ModelInterface extends Document & Visibility
>(
  document: ModelInterface,
  user?: IUser
) => {
  const isOwner = checkDocumentOwner(document, user);

  if (isOwner) return true;

  if (document.public === false) return false;

  return true;
};
