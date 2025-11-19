// Custom error classes for different error types

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any

  constructor(code: string, message: string, statusCode: number, details?: any) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Authentication Errors (401)
export class AuthenticationError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 401, details)
  }
}

// Validation Errors (400)
export class ValidationError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 400, details)
  }
}

// Resource Not Found Errors (404)
export class NotFoundError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 404, details)
  }
}

// Business Logic Errors (409)
export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 409, details)
  }
}

// Forbidden Errors (403)
export class ForbiddenError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 403, details)
  }
}

// Database Errors (500)
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, 500, details)
  }
}

// External Service Errors (500)
export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super('EXTERNAL_SERVICE_ERROR', message, 500, details)
  }
}

// Error factory functions for common errors
export const Errors = {
  // Authentication
  invalidCredentials: () => 
    new AuthenticationError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password'),
  tokenExpired: () => 
    new AuthenticationError('AUTH_TOKEN_EXPIRED', 'JWT token has expired'),
  tokenInvalid: () => 
    new AuthenticationError('AUTH_TOKEN_INVALID', 'JWT token is malformed or invalid'),
  unauthorized: () => 
    new AuthenticationError('AUTH_UNAUTHORIZED', 'User not authorized for this resource'),

  // Validation
  ageRestriction: () => 
    new ValidationError('VALIDATION_AGE_RESTRICTION', 'Age must be between 18 and 65'),
  requiredField: (field: string) => 
    new ValidationError('VALIDATION_REQUIRED_FIELD', `Required field missing: ${field}`),
  invalidFormat: (field: string) => 
    new ValidationError('VALIDATION_INVALID_FORMAT', `Invalid format for field: ${field}`),
  duplicateEmail: () => 
    new ValidationError('VALIDATION_DUPLICATE_EMAIL', 'Email already registered'),

  // Resource Not Found
  resourceNotFound: (resource: string) => 
    new NotFoundError('RESOURCE_NOT_FOUND', `${resource} not found`),
  userNotFound: () => 
    new NotFoundError('USER_NOT_FOUND', 'User not found'),
  activityNotFound: () => 
    new NotFoundError('ACTIVITY_NOT_FOUND', 'Activity not found'),

  // Business Logic
  activityFull: () => 
    new ConflictError('ACTIVITY_FULL', 'Activity has reached maximum capacity'),
  pastEditDeadline: () => 
    new ConflictError('ACTIVITY_PAST_EDIT_DEADLINE', 'Cannot edit activity within 1 hour of start time'),
  alreadyJoined: () => 
    new ConflictError('ALREADY_JOINED', 'User has already joined this activity'),
  notParticipant: () => 
    new ConflictError('NOT_PARTICIPANT', 'User is not a participant of this activity'),
  cannotFollowSelf: () => 
    new ConflictError('CANNOT_FOLLOW_SELF', 'Cannot follow yourself'),
  alreadyFollowing: () => 
    new ConflictError('ALREADY_FOLLOWING', 'Already following this user'),

  // Forbidden
  forbidden: (message: string = 'Access forbidden') => 
    new ForbiddenError('FORBIDDEN', message),

  // Server Errors
  database: (message: string = 'Database operation failed', details?: any) => 
    new DatabaseError(message, details),
  externalService: (message: string = 'External service unavailable', details?: any) => 
    new ExternalServiceError(message, details),
  internal: (message: string = 'An unexpected error occurred') => 
    new AppError('INTERNAL_SERVER_ERROR', message, 500),
}
