import { Errors } from './errors.js'

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw Errors.invalidFormat('email')
  }
}

export function validateAge(age: number): void {
  if (age < 18 || age > 65) {
    throw Errors.ageRestriction()
  }
}

export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw Errors.invalidFormat('password (minimum 8 characters)')
  }
}

export function validateRequiredFields(data: any, fields: string[]): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw Errors.requiredField(field)
    }
  }
}
