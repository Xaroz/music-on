/**
 * Returns only valid that are not null nor undefined
 */
export function isNonNullable<TValue>(
  value: TValue | undefined | null
): value is TValue {
  return value !== null && value !== undefined;
}
