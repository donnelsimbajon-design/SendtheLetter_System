/** Treat dates from clients as instants, never silently publish a past capsule. */
export function validateFutureRelease(value: unknown, now = Date.now()): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' && !(value instanceof Date)) return 'Invalid release date.';
  const date = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(date)) return 'Invalid release date.';
  if (date <= now) return 'Choose a future date and time for delivery.';
  return null;
}
