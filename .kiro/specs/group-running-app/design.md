# Design Document: Group Running App

## Overview

The Group Running App is a Progressive Web Application (PWA) that enables users to create, discover, and participate in social running activities. The system follows a modern three-tier architecture with a React-based frontend, Node.js/Express backend API, and AWS cloud services for data persistence and scalability.

### Technology Stack

**Frontend:**
- React 18+ with TypeScript for type safety
- React Router for navigation
- Material-UI (MUI) for responsive UI components
- Leaflet.js for interactive maps and route visualization
- Socket.io-client for real-time chat functionality
- Geolocation API for GPS tracking
- Service Workers for PWA capabilities

**Backend:**
- Node.js with Express.js framework
- TypeScript for type-safe server code
- Socket.io for WebSocket connections
- JWT (JSON Web Tokens) for authentication
- Bcrypt for password hashing

**Database & Cloud Services:**
- AWS RDS (PostgreSQL) for relational data storage
- AWS S3 for storing route data and user-generated content
- AWS CloudFront for CDN and static asset delivery
- AWS SNS for push notifications
- AWS Lambda for scheduled tasks (reminders, cleanup)

**Development & Deployment:**
- Vite for fast development and optimized builds
- Docker for containerization
- AWS Elastic Beanstalk or EC2 for backend hosting
- AWS Amplify or S3 + CloudFront for frontend hosting

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React PWA (Mobile-First Responsive)            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Auth    │ │ Activity │ │   GPS    │ │  Social  │ │ │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS / WSS
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│                    (Express.js + Socket.io)                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
│   Auth Service │ │ Activity Service│ │  User Service  │
└───────┬────────┘ └────────┬────────┘ └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer (AWS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   S3 Bucket  │  │  SNS Topics  │     │
│  │     (RDS)    │  │  (Route Data)│  │(Notifications)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Patterns

1. **Client-Server Architecture**: Clear separation between frontend and backend
2. **RESTful API**: Standard HTTP methods for CRUD operations
3. **WebSocket Protocol**: Real-time bidirectional communication for chat
4. **Repository Pattern**: Data access abstraction layer
5. **Service Layer Pattern**: Business logic encapsulation
6. **JWT Authentication**: Stateless authentication mechanism

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module

**Components:**
- `LoginPage`: User login interface
- `RegisterPage`: New user registration with age validation
- `AuthContext`: React Context for managing authentication state
- `ProtectedRoute`: Route wrapper for authenticated pages

**Key Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  age: number;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  age: number;
  agreedToTerms: boolean;
}
```

#### 2. Activity Management Module

**Components:**
- `ActivityList`: Display and filter available activities
- `ActivityCard`: Individual activity preview
- `ActivityDetail`: Full activity information page
- `CreateActivityForm`: Activity creation interface
- `EditActivityForm`: Activity modification interface
- `ActivityMap`: Interactive map showing activity location

**Key Interfaces:**
```typescript
interface Activity {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  scheduledDate: Date;
  location: Location;
  route: string;
  distance: number; // in kilometers
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Participant {
  userId: string;
  displayName: string;
  joinedAt: Date;
}
```

#### 3. GPS Tracking Module

**Components:**
- `GPSTracker`: Real-time location tracking component
- `RouteMap`: Display recorded route on map
- `PerformanceStats`: Show distance, speed, time metrics
- `RouteHistory`: List of past recorded routes

**Key Interfaces:**
```typescript
interface GPSPosition {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

interface RouteData {
  id: string;
  activityId: string;
  userId: string;
  positions: GPSPosition[];
  totalDistance: number;
  averageSpeed: number;
  duration: number; // in seconds
  startTime: Date;
  endTime: Date;
}

interface PerformanceMetrics {
  currentSpeed: number;
  averageSpeed: number;
  distance: number;
  elapsedTime: number;
}
```

#### 4. Social Interaction Module

**Components:**
- `UserProfile`: Display user information and statistics
- `FollowButton`: Follow/unfollow functionality
- `FollowersList`: Display followers and following
- `UserSearch`: Search for other users
- `ActivityFeed`: Display activities from followed users

**Key Interfaces:**
```typescript
interface UserProfile {
  id: string;
  displayName: string;
  totalRuns: number;
  totalDistance: number;
  averageRating: number;
  followersCount: number;
  followingCount: number;
  recentActivities: Activity[];
  joinedDate: Date;
}

interface SocialConnection {
  followerId: string;
  followingId: string;
  createdAt: Date;
}
```

#### 5. Chat Module

**Components:**
- `ChatRoom`: Activity-specific chat interface
- `MessageList`: Display chat messages
- `MessageInput`: Send new messages
- `ChatNotification`: Unread message indicator

**Key Interfaces:**
```typescript
interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatRoom {
  id: string;
  activityId: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: Date;
}
```

#### 6. Notification Module

**Components:**
- `NotificationBell`: Display notification count
- `NotificationList`: List all notifications
- `NotificationItem`: Individual notification display

**Key Interfaces:**
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'activity_reminder' | 'activity_cancelled' | 'new_message' | 'new_follower' | 'activity_joined';
  title: string;
  message: string;
  relatedId?: string; // activityId, userId, etc.
  isRead: boolean;
  createdAt: Date;
}
```

### Backend Services

#### 1. Authentication Service

**Responsibilities:**
- User registration with validation
- Password hashing and verification
- JWT token generation and validation
- Session management

**API Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh-token
```

#### 2. User Service

**Responsibilities:**
- User profile management
- Follow/unfollow operations
- User search functionality
- Profile statistics calculation

**API Endpoints:**
```
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/search?q=:query
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
GET    /api/users/:id/followers
GET    /api/users/:id/following
GET    /api/users/:id/stats
```

#### 3. Activity Service

**Responsibilities:**
- Activity CRUD operations
- Activity search and filtering
- Participant management
- Activity status updates

**API Endpoints:**
```
POST   /api/activities
GET    /api/activities
GET    /api/activities/:id
PUT    /api/activities/:id
DELETE /api/activities/:id
POST   /api/activities/:id/join
DELETE /api/activities/:id/leave
GET    /api/activities/:id/participants
GET    /api/activities/nearby?lat=:lat&lng=:lng&radius=:radius
GET    /api/activities/search?date=:date&distance=:distance
```

#### 4. GPS Service

**Responsibilities:**
- Route data storage and retrieval
- Performance metrics calculation
- Route visualization data generation

**API Endpoints:**
```
POST   /api/routes
GET    /api/routes/:id
GET    /api/routes/user/:userId
POST   /api/routes/:id/positions
GET    /api/routes/:id/metrics
```

#### 5. Chat Service

**Responsibilities:**
- Chat room creation and management
- Message delivery via WebSocket
- Message history retrieval
- Chat room access control

**WebSocket Events:**
```
// Client to Server
join_room: { roomId, userId }
leave_room: { roomId, userId }
send_message: { roomId, userId, content }

// Server to Client
message_received: { message }
user_joined: { userId, displayName }
user_left: { userId }
```

**API Endpoints:**
```
GET    /api/chat/rooms/:activityId
GET    /api/chat/rooms/:roomId/messages
POST   /api/chat/rooms/:roomId/messages
```

#### 6. Notification Service

**Responsibilities:**
- Notification creation and delivery
- Scheduled notification triggers
- Notification status management

**API Endpoints:**
```
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
DELETE /api/notifications/:id
```

## Data Models

### Database Schema (PostgreSQL)

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 65),
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities Table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address VARCHAR(500),
  route TEXT,
  distance DECIMAL(6, 2) NOT NULL,
  max_participants INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('upcoming', 'in-progress', 'completed', 'cancelled'))
);

-- Activity Participants Table
CREATE TABLE activity_participants (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, user_id)
);

-- Social Connections Table
CREATE TABLE social_connections (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Routes Table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_distance DECIMAL(6, 2) NOT NULL,
  average_speed DECIMAL(5, 2) NOT NULL,
  duration INTEGER NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  positions_s3_key VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Rooms Table
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID UNIQUE NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Ratings Table
CREATE TABLE activity_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_id, user_id)
);

-- Indexes for Performance
CREATE INDEX idx_activities_creator ON activities(creator_id);
CREATE INDEX idx_activities_scheduled_date ON activities(scheduled_date);
CREATE INDEX idx_activities_location ON activities(latitude, longitude);
CREATE INDEX idx_activity_participants_user ON activity_participants(user_id);
CREATE INDEX idx_social_connections_follower ON social_connections(follower_id);
CREATE INDEX idx_social_connections_following ON social_connections(following_id);
CREATE INDEX idx_routes_user ON routes(user_id);
CREATE INDEX idx_routes_activity ON routes(activity_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(chat_room_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
```

### Data Relationships

- One User can create many Activities (1:N)
- One Activity can have many Participants (M:N through activity_participants)
- One User can follow many Users (M:N through social_connections)
- One Activity has one Chat Room (1:1)
- One Chat Room has many Messages (1:N)
- One User can have many Routes (1:N)
- One Activity can have many Routes (1:N)
- One User can have many Notifications (1:N)
- One Activity can have many Ratings (1:N)

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Error Categories

**1. Authentication Errors (401)**
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_UNAUTHORIZED`: User not authorized for this resource

**2. Validation Errors (400)**
- `VALIDATION_AGE_RESTRICTION`: Age outside 18-65 range
- `VALIDATION_REQUIRED_FIELD`: Required field missing
- `VALIDATION_INVALID_FORMAT`: Data format incorrect
- `VALIDATION_DUPLICATE_EMAIL`: Email already registered

**3. Resource Errors (404)**
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `USER_NOT_FOUND`: User ID not found
- `ACTIVITY_NOT_FOUND`: Activity ID not found

**4. Business Logic Errors (409)**
- `ACTIVITY_FULL`: Activity reached maximum capacity
- `ACTIVITY_PAST_EDIT_DEADLINE`: Cannot edit activity within 1 hour of start
- `ALREADY_JOINED`: User already joined this activity
- `NOT_PARTICIPANT`: User is not a participant of this activity

**5. Server Errors (500)**
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: AWS service unavailable
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### Frontend Error Handling Strategy

```typescript
// Centralized error handler
class ErrorHandler {
  static handle(error: any): void {
    if (error.response) {
      // API error response
      const { code, message } = error.response.data.error;
      
      switch (code) {
        case 'AUTH_TOKEN_EXPIRED':
          // Redirect to login
          this.redirectToLogin();
          break;
        case 'ACTIVITY_FULL':
          // Show user-friendly message
          this.showToast('This activity is full', 'warning');
          break;
        default:
          this.showToast(message, 'error');
      }
    } else if (error.request) {
      // Network error
      this.showToast('Network error. Please check your connection.', 'error');
    } else {
      // Client-side error
      this.showToast('An unexpected error occurred', 'error');
    }
    
    // Log to monitoring service
    this.logError(error);
  }
}
```

### Backend Error Handling Middleware

```typescript
// Express error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });
  
  // Send error response
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  });
});
```

## Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  (10%)
        └─────────────┘
      ┌─────────────────┐
      │ Integration Tests│  (30%)
      └─────────────────┘
    ┌─────────────────────┐
    │    Unit Tests       │  (60%)
    └─────────────────────┘
```

### Unit Testing

**Frontend (Jest + React Testing Library):**
- Component rendering tests
- User interaction tests
- State management tests
- Utility function tests

**Backend (Jest + Supertest):**
- Service layer logic tests
- Data validation tests
- Authentication/authorization tests
- Database query tests (with test database)

**Coverage Target:** 80% code coverage

### Integration Testing

**API Integration Tests:**
- End-to-end API workflow tests
- Database integration tests
- WebSocket connection tests
- External service integration tests (AWS mocks)

**Test Scenarios:**
- User registration → login → create activity → join activity
- GPS tracking → route recording → data visualization
- Chat room creation → message sending → notification delivery

### End-to-End Testing (Playwright/Cypress)

**Critical User Flows:**
1. New user registration and first activity creation
2. Activity discovery, joining, and GPS tracking
3. Social interactions (follow, chat, rate)
4. Notification delivery and responsiveness

**Test Environments:**
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Different screen sizes (320px to 1920px)

### Performance Testing

**Load Testing (Artillery/k6):**
- Concurrent user simulation (100, 500, 1000 users)
- API endpoint response time measurement
- WebSocket connection stability
- Database query performance

**Metrics to Monitor:**
- API response time < 2 seconds (95th percentile)
- WebSocket message delivery < 2 seconds
- Page load time < 3 seconds
- Crash rate < 1%

### Testing Tools

- **Unit/Integration:** Jest, React Testing Library, Supertest
- **E2E:** Playwright or Cypress
- **Load Testing:** Artillery or k6
- **API Testing:** Postman/Newman for automated API tests
- **Code Coverage:** Istanbul/nyc
- **Mocking:** MSW (Mock Service Worker) for API mocking

### Continuous Integration

**GitHub Actions Workflow:**
1. Run linting (ESLint, Prettier)
2. Run unit tests
3. Run integration tests
4. Generate coverage report
5. Build application
6. Run E2E tests (on staging environment)
7. Deploy to staging (on main branch)

## Security Considerations

### Authentication & Authorization

- JWT tokens with 24-hour expiration
- Refresh tokens with 7-day expiration
- Password requirements: minimum 8 characters, mix of letters and numbers
- Rate limiting on login attempts (5 attempts per 15 minutes)
- HTTPS-only communication

### Data Protection

- All passwords hashed with bcrypt (salt rounds: 10)
- Sensitive data encrypted at rest (AWS RDS encryption)
- TLS 1.2+ for data in transit
- CORS configuration to allow only trusted origins
- Input sanitization to prevent XSS attacks
- Parameterized queries to prevent SQL injection

### Privacy

- User location data stored only with consent
- Location data retention policy: 90 days
- User data deletion within 30 days of account deletion
- Privacy policy and terms of service acceptance required
- GDPR compliance considerations

## Deployment Strategy

### Development Environment

- Local development with Docker Compose
- PostgreSQL container for database
- Redis container for session storage
- Hot reload for frontend and backend

### Staging Environment

- AWS Elastic Beanstalk for backend
- AWS Amplify for frontend
- AWS RDS (PostgreSQL) - small instance
- Automated deployment on push to `develop` branch

### Production Environment

- AWS Elastic Beanstalk with auto-scaling (2-10 instances)
- AWS Amplify with CloudFront CDN
- AWS RDS (PostgreSQL) - production instance with read replicas
- AWS S3 for route data storage
- AWS SNS for push notifications
- AWS Lambda for scheduled tasks
- Automated deployment on push to `main` branch (with approval)

### Monitoring & Logging

- AWS CloudWatch for application logs
- AWS CloudWatch Alarms for error rates and performance
- Sentry for error tracking and reporting
- Google Analytics for user behavior tracking
- Custom dashboard for WAU/MAU metrics

## Migration Path to iOS

> Note: This section describes **future work** only.  
> The current FYP implementation focuses on the web Progressive Web App (PWA).  
> A native iOS application is considered as a possible extension and is **not** part of the implemented scope.

### Phase 1: Web Application (Current Design)

- Fully functional PWA with all features
- Installable on iOS home screen
- Offline capability with Service Workers
- Push notifications via web APIs

### Phase 2: iOS Native Preparation

- API design remains unchanged (RESTful + WebSocket)
- Backend services fully compatible with native clients
- Authentication flow supports native app tokens
- Deep linking support for activity sharing

### Phase 3: iOS Native Development

**Technology Stack:**
- Swift + SwiftUI for native iOS app
- Combine framework for reactive programming
- CoreLocation for GPS tracking
- MapKit for map visualization
- URLSession for API communication
- Starscream for WebSocket connections

**Reusable Components:**
- All backend services (no changes needed)
- Database schema (no changes needed)
- API contracts (no changes needed)
- Business logic (reimplemented in Swift)

**iOS-Specific Enhancements:**
- Native push notifications (APNs)
- Background location tracking
- HealthKit integration for fitness data
- Apple Sign-In option
- Native performance optimizations

### Code Sharing Strategy

- Backend code: 100% reusable
- API contracts: 100% reusable
- UI/UX design: Adapted to iOS Human Interface Guidelines
- Business logic: Reimplemented in Swift (following same patterns)
- Testing strategy: Similar approach with XCTest

## Performance Optimization

### Frontend Optimization

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Service Worker caching strategy
- Debouncing for search and filter inputs
- Virtual scrolling for long lists
- Memoization for expensive computations

### Backend Optimization

- Database query optimization with proper indexes
- Connection pooling for database connections
- Caching frequently accessed data (Redis)
- Pagination for list endpoints
- Compression for API responses (gzip)
- CDN for static assets

### GPS Data Optimization

- Store GPS positions in S3 (not database)
- Compress route data before storage
- Batch GPS position updates (every 5 seconds)
- Reduce GPS accuracy when not in active tracking

## Scalability Considerations

### Horizontal Scaling

- Stateless backend services (can add more instances)
- Load balancer distributes traffic
- Database read replicas for read-heavy operations
- WebSocket connections distributed across instances (with Redis adapter)

### Database Scaling

- Vertical scaling for write operations
- Read replicas for read operations
- Partitioning for large tables (routes, chat_messages)
- Archiving old data (completed activities > 90 days)

### Caching Strategy

- Redis for session storage
- Redis for frequently accessed data (user profiles, activity lists)
- CloudFront CDN for static assets
- Browser caching for images and assets

## Conclusion

This design provides a solid foundation for building the Group Running App as a Progressive Web Application. The architecture is scalable, maintainable, and designed with a clear migration path to iOS native development. The technology choices prioritize developer productivity on Windows while ensuring feature parity with future native implementations.
