/**
 * Returns only valid that are not null nor undefined
 */
export function isNonNullable<TValue>(
  value: TValue | undefined | null
): value is TValue {
  return value !== null && value !== undefined;
}

/**
 * Takes fileSize and return a string containing the maximum coverted size along with its unit
 */
export function formatFileSize(size: number): string {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${Math.floor(size)}${units[index]}`;
}
