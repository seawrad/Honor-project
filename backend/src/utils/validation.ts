export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError(
      'Invalid email format',
      'VALIDATION_INVALID_FORMAT'
    )
  }
}

export function validateAge(age: number): void {
  if (age < 18 || age > 65) {
    throw new ValidationError(
      'Age must be between 18 and 65 years',
      'VALIDATION_AGE_RESTRICTION'
    )
  }
}

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError(
      'Password must be at least 8 characters long',
      'VALIDATION_INVALID_FORMAT'
    )
  }
}

export function validateRequiredFields(data: any, fields: string[]): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new ValidationError(
        `Required field missing: ${field}`,
        'VALIDATION_REQUIRED_FIELD',
        { field }
      )
    }
  }
}
