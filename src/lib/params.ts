/** Normalize Expo Router search params that may be `string | string[]`. */
export function asParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
