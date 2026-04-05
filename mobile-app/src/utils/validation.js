export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && PHONE_REGEX.test(phone.trim());
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function normalizePhone(phone) {
  return typeof phone === 'string' ? phone.trim().replace(/\s+/g, ' ') : '';
}