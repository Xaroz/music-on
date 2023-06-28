import { Model } from 'mongoose';

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
