/**
 * OpenAPI/Swagger documentation for Group Running App API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Group Running App API',
    version: '1.0.0',
    description: 'REST API for the Group Running App - connect with runners and join group activities',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          location: { type: 'string' },
          hostId: { type: 'string', format: 'uuid' },
          maxParticipants: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  displayName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User created' }, 400: { description: 'Validation error' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Returns accessToken and refreshToken' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current user profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/activities': {
      get: {
        summary: 'Search activities',
        tags: ['Activities'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'query', in: 'query', schema: { type: 'string' } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'List of activities' } },
      },
      post: {
        summary: 'Create activity',
        tags: ['Activities'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  location: { type: 'string' },
                  maxParticipants: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Activity created' } },
      },
    },
    '/activities/{id}': {
      get: { summary: 'Get activity by ID', tags: ['Activities'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Activity details' } } },
      put: { summary: 'Update activity', tags: ['Activities'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Updated' } } },
      delete: { summary: 'Cancel activity', tags: ['Activities'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Cancelled' } } },
    },
    '/activities/{id}/join': {
      post: { summary: 'Join activity', tags: ['Activities'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Joined' } } },
    },
    '/activities/{id}/leave': {
      delete: { summary: 'Leave activity', tags: ['Activities'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Left' } } },
    },
    '/users/{id}': {
      get: { summary: 'Get user profile', tags: ['Users'], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User profile' } } },
    },
    '/leaderboard': {
      get: { summary: 'Get leaderboard', tags: ['Leaderboard'], responses: { 200: { description: 'Leaderboard data' } } },
    },
  },
}
