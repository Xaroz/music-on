import { Model, Schema } from 'mongoose';

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
 * Check if the array of giving IDs have any duplicates
 */
export const validateDuplicateData = (values: Array<Schema.Types.ObjectId>) => {
  const uniqueValues = [...new Set(values.map((value) => value.toString()))];

  return uniqueValues.length === values.length;
};
