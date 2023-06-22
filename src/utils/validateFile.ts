import AppError from './appError';
import { formatFileSize } from './base';

export function validateFile(
  file: Express.Multer.File | undefined,
  expectedMimeType: string,
  maxFileSize: number
): AppError | null {
  if (!file) return null;

  if (!file.mimetype.startsWith(expectedMimeType))
    return new AppError(
      `${file.fieldname} must be ${expectedMimeType.replace('/', '')} file`,
      400
    );

  if (file.size > maxFileSize)
    return new AppError(
      `${file.fieldname} must not exceed ${formatFileSize(maxFileSize)}`,
      400
    );

  return null;
}
