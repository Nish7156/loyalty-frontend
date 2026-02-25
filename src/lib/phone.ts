export const DEFAULT_PHONE_PREFIX = '+91';

export function normalizeIndianPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return DEFAULT_PHONE_PREFIX + digits;
  if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;
  if (trimmed.startsWith('+91')) return trimmed;
  return trimmed;
}
