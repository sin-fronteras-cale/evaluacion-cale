// Validation helpers using built-in methods (Zod can be added later if needed)

export type ValidationError = {
  field: string;
  message: string;
};

export class ValidationException extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field: fieldName, message: `${fieldName} es requerido` };
  }
  return null;
}

export function parseIntSafe(value: any, defaultValue: number = 0): number {
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseIntSafe(searchParams.get('page'), 1));
  const limit = Math.min(100, Math.max(1, parseIntSafe(searchParams.get('limit'), 50)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function validateCategory(category: string): boolean {
  return typeof category === 'string' && category.length > 0;
}

export function validateRole(role: string): boolean {
  return ['admin', 'user', 'supertaxis', 'admin_supertaxis'].includes(role);
}
