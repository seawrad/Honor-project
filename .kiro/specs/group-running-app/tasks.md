# Implementation Plan

> Scope note (FYP): This implementation plan describes the full roadmap towards a production-ready system.  
> For the current FYP, the primary implementation focuses on the **web PWA features** covered by the tasks that are already marked as completed (mainly 1–19).  
> Tasks that remain unchecked (e.g. full AWS infrastructure, staging/production deployment, extensive E2E and load testing) are treated as **future work** and are not required to be fully implemented for this project.

- [x] 1. Set up project structure and development environment






  - Initialize monorepo structure with separate frontend and backend directories
  - Configure TypeScript for both frontend and backend
  - Set up Vite for frontend development with React and hot reload
  - Configure ESLint and Prettier for code quality
  - Create Docker Compose file for local PostgreSQL and Redis containers
  - Set up environment variable management (.env files)
  - Initialize Git repository with .gitignore
  - _Requirements: 12.1, 12.2_

- [x] 2. Implement database schema and connection




  - [x] 2.1 Create PostgreSQL database schema


    - Write SQL migration files for all tables (users, activities, activity_participants, social_connections, routes, chat_rooms, chat_messages, notifications, activity_ratings)
    - Add indexes for performance optimization
    - Set up foreign key constraints and check constraints
    - _Requirements: 1.1, 2.1, 6.1, 11.4_
  - [x] 2.2 Set up database connection and ORM


    - Configure database connection pool with pg library
    - Create database client wrapper with error handling
    - Implement migration runner script
    - _Requirements: 10.3_

- [x] 3. Build authentication system




  - [x] 3.1 Implement user registration


    - Create user registration API endpoint (POST /api/auth/register)
    - Implement age validation (18-65 years)
    - Hash passwords using bcrypt before storage
    - Validate email format and uniqueness
    - Store user data in database
    - _Requirements: 1.1, 1.2, 11.1_
  - [x] 3.2 Implement user login and JWT authentication


    - Create login API endpoint (POST /api/auth/login)
    - Verify credentials against database
    - Generate JWT access token (24-hour expiration)
    - Generate refresh token (7-day expiration)
    - Return tokens and user data
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 3.3 Create authentication middleware


    - Implement JWT verification middleware
    - Extract user information from token
    - Handle token expiration and invalid tokens
    - Protect routes requiring authentication
    - _Requirements: 1.4_
  - [x] 3.4 Write authentication tests


    - Test registration with valid and invalid data
    - Test age restriction validation
    - Test login with correct and incorrect credentials
    - Test JWT token generation and verification
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 4. Create user profile and social features backend



  - [x] 4.1 Implement user profile endpoints


    - Create GET /api/users/:id endpoint to fetch user profile
    - Create PUT /api/users/:id endpoint to update profile
    - Create DELETE /api/users/:id endpoint for account deletion
    - Calculate and return user statistics (total runs, distance, ratings)
    - _Requirements: 6.2, 11.3, 11.4_
  - [x] 4.2 Implement follow/unfollow functionality

    - Create POST /api/users/:id/follow endpoint
    - Create DELETE /api/users/:id/follow endpoint
    - Create GET /api/users/:id/followers endpoint
    - Create GET /api/users/:id/following endpoint
    - Prevent self-following
    - _Requirements: 6.1_
  - [x] 4.3 Implement user search

    - Create GET /api/users/search endpoint with query parameter
    - Implement case-insensitive search by display name
    - Return paginated results
    - _Requirements: 6.4_
  - [x] 4.4 Write user service tests


    - Test profile retrieval and updates
    - Test follow/unfollow operations
    - Test user search functionality
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 5. Build activity management backend




  - [x] 5.1 Implement activity CRUD operations


    - Create POST /api/activities endpoint for activity creation
    - Create GET /api/activities/:id endpoint for activity details
    - Create PUT /api/activities/:id endpoint for activity updates
    - Create DELETE /api/activities/:id endpoint for activity cancellation
    - Validate activity data (date, location, distance, max participants)
    - Enforce 1-hour edit deadline before scheduled start time
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 5.2 Implement activity participation

    - Create POST /api/activities/:id/join endpoint
    - Create DELETE /api/activities/:id/leave endpoint
    - Check maximum capacity before allowing join
    - Enforce 1-hour leave deadline before scheduled start time
    - Update participant count
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.3 Implement activity search and filtering

    - Create GET /api/activities endpoint with filters
    - Implement nearby activities search using latitude/longitude
    - Add filters for date range, distance, and location radius
    - Sort results by proximity to user location
    - Return paginated results
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.4 Create chat room on activity creation


    - Automatically create chat room when activity is created
    - Link chat room to activity ID
    - Grant access to creator and participants
    - _Requirements: 7.1, 7.2_
  - [x] 5.5 Write activity service tests


    - Test activity creation and validation
    - Test join/leave operations with capacity checks
    - Test activity search and filtering
    - Test edit deadline enforcement
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_

- [x] 6. Implement GPS tracking and route recording backend



  - [x] 6.1 Create route recording endpoints


    - Create POST /api/routes endpoint to start route recording
    - Create POST /api/routes/:id/positions endpoint to save GPS positions
    - Store GPS position arrays in AWS S3 as JSON
    - Store route metadata in database (distance, speed, duration)
    - _Requirements: 5.1, 5.3_
  - [x] 6.2 Implement performance metrics calculation


    - Calculate total distance from GPS positions
    - Calculate average speed from distance and duration
    - Calculate elapsed time from start and end timestamps
    - Create GET /api/routes/:id/metrics endpoint
    - _Requirements: 5.2, 5.3_
  - [x] 6.3 Create route history endpoints


    - Create GET /api/routes/user/:userId endpoint
    - Return paginated list of user's routes
    - Include activity information with each route
    - _Requirements: 5.5_
  - [x] 6.4 Write GPS service tests


    - Test route creation and position storage
    - Test metrics calculation accuracy
    - Test route history retrieval
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 7. Build real-time chat system




  - [x] 7.1 Set up Socket.io server


    - Initialize Socket.io with Express server
    - Configure CORS for WebSocket connections
    - Implement JWT authentication for WebSocket connections
    - _Requirements: 7.1_
  - [x] 7.2 Implement chat room WebSocket events


    - Handle join_room event with access control
    - Handle leave_room event
    - Handle send_message event with message validation
    - Broadcast messages to all room participants
    - Store messages in database
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 7.3 Create chat message history endpoints


    - Create GET /api/chat/rooms/:activityId endpoint
    - Create GET /api/chat/rooms/:roomId/messages endpoint
    - Return paginated message history
    - Implement 7-day message retention
    - _Requirements: 7.5_


  - [x] 7.4 Write chat service tests



    - Test WebSocket connection and authentication
    - Test message sending and broadcasting
    - Test room access control
    - Test message history retrieval
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement notification system backend




  - [x] 8.1 Create notification service


    - Implement notification creation function
    - Create POST /api/notifications endpoint (internal use)
    - Store notifications in database
    - _Requirements: 8.1_
  - [x] 8.2 Implement notification triggers


    - Send notification when user joins activity
    - Send notification when activity is cancelled
    - Send notification when new chat message arrives
    - Send notification when user gains a follower
    - _Requirements: 8.1, 8.4, 8.5, 2.5_
  - [x] 8.3 Create scheduled notification tasks


    - Set up AWS Lambda function for scheduled tasks
    - Send 24-hour reminder before activity start
    - Send 1-hour reminder before activity start
    - Query activities and send notifications to participants
    - _Requirements: 8.2, 8.3_
  - [x] 8.4 Create notification management endpoints


    - Create GET /api/notifications endpoint
    - Create PUT /api/notifications/:id/read endpoint
    - Create PUT /api/notifications/read-all endpoint
    - Create DELETE /api/notifications/:id endpoint
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 8.5 Write notification service tests


    - Test notification creation
    - Test notification triggers
    - Test notification retrieval and updates
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implement activity rating system






  - [x] 9.1 Create rating endpoints

    - Create POST /api/activities/:id/ratings endpoint
    - Validate rating value (1-5 stars)
    - Store rating and optional feedback
    - Prevent duplicate ratings from same user
    - _Requirements: 9.1, 9.2_
  - [x] 9.2 Calculate and display average ratings


    - Calculate average rating for each activity
    - Include rating count
    - Display ratings on activity creator's profile
    - Create GET /api/activities/:id/ratings endpoint
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 9.3 Write rating service tests

    - Test rating submission and validation
    - Test average rating calculation
    - Test duplicate rating prevention
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 10. Build frontend authentication UI






  - [x] 10.1 Create authentication context and hooks

    - Implement AuthContext with React Context API
    - Create useAuth hook for accessing auth state
    - Store JWT tokens in localStorage
    - Implement automatic token refresh
    - _Requirements: 1.3, 1.4_
  - [x] 10.2 Build registration page


    - Create registration form with Material-UI components
    - Add form validation (email, password, age, terms acceptance)
    - Display age restriction error for invalid ages
    - Call registration API endpoint
    - Redirect to login on success
    - _Requirements: 1.1, 1.2_
  - [x] 10.3 Build login page


    - Create login form with email and password fields
    - Add form validation
    - Call login API endpoint
    - Store tokens and user data
    - Redirect to home page on success
    - Display error messages for failed login
    - _Requirements: 1.4, 1.5_
  - [x] 10.4 Implement protected routes


    - Create ProtectedRoute component
    - Check authentication status
    - Redirect to login if not authenticated
    - Wrap authenticated pages with ProtectedRoute
    - _Requirements: 1.4_
  - [x] 10.5 Write authentication UI tests


    - Test registration form validation
    - Test login form validation
    - Test protected route behavior
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 11. Create activity management UI





  - [x] 11.1 Build activity list page


    - Create ActivityList component with Material-UI cards
    - Display activity cards with key information
    - Implement infinite scroll or pagination
    - Show loading states
    - _Requirements: 3.1, 3.3_
  - [x] 11.2 Implement activity search and filters


    - Create search bar and filter controls
    - Add date range picker
    - Add distance range slider
    - Add location radius filter
    - Update activity list based on filters
    - _Requirements: 3.2_
  - [x] 11.3 Build activity detail page


    - Display full activity information
    - Show activity location on Leaflet map
    - Display participant list
    - Show join/leave button based on participation status
    - Display "full" indicator when at capacity
    - _Requirements: 3.5, 4.1, 4.2_
  - [x] 11.4 Create activity creation form


    - Build form with all activity fields
    - Integrate Leaflet map for location selection
    - Add date/time picker
    - Validate form inputs
    - Call activity creation API
    - _Requirements: 2.1, 2.2_
  - [x] 11.5 Create activity edit form


    - Reuse creation form components
    - Pre-fill with existing activity data
    - Disable editing within 1 hour of start time
    - Call activity update API
    - _Requirements: 2.3_
  - [x] 11.6 Implement activity cancellation


    - Add cancel button for activity creators
    - Show confirmation dialog
    - Call activity cancellation API
    - Redirect to activity list
    - _Requirements: 2.4, 2.5_
  - [x] 11.7 Write activity UI tests


    - Test activity list rendering
    - Test search and filter functionality
    - Test activity creation and editing
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 12. Build GPS tracking UI




  - [x] 12.1 Create GPS tracker component


    - Request geolocation permissions
    - Start GPS tracking on activity start
    - Collect GPS positions at 1-second intervals
    - Display real-time position on map
    - _Requirements: 5.1, 12.3_
  - [x] 12.2 Build performance metrics display


    - Show real-time distance calculation
    - Display current and average speed
    - Show elapsed time counter
    - Update metrics every second
    - _Requirements: 5.2_
  - [x] 12.3 Implement route recording controls


    - Add start/stop tracking buttons
    - Save route data to backend on completion
    - Show confirmation on successful save
    - _Requirements: 5.1, 5.3_
  - [x] 12.4 Create route visualization


    - Display recorded route on Leaflet map
    - Draw route polyline from GPS positions
    - Show start and end markers
    - Display route statistics
    - _Requirements: 5.4_
  - [x] 12.5 Build route history page


    - Display list of user's past routes
    - Show route preview on map
    - Display route metrics
    - Link to associated activity
    - _Requirements: 5.5_
  - [x] 12.6 Write GPS UI tests


    - Test GPS permission handling
    - Test metrics calculation display
    - Test route visualization
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 13. Implement social features UI





  - [x] 13.1 Build user profile page


    - Display user information and statistics
    - Show total runs, distance, and average rating
    - Display recent activities
    - Show followers and following counts
    - Add follow/unfollow button
    - _Requirements: 6.2, 6.3_
  - [x] 13.2 Create user search interface


    - Build search bar component
    - Display search results as user cards
    - Link to user profiles
    - Show follow status for each user
    - _Requirements: 6.4_
  - [x] 13.3 Build followers/following lists


    - Create list components for followers and following
    - Display user cards with follow/unfollow buttons
    - Link to user profiles
    - _Requirements: 6.1_
  - [x] 13.4 Create activity feed


    - Display activities from followed users
    - Show activity cards with creator information
    - Link to activity details
    - Implement infinite scroll
    - _Requirements: 6.5_
  - [x] 13.5 Write social features UI tests


    - Test profile display
    - Test user search
    - Test follow/unfollow functionality
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 14. Build real-time chat UI



  - [x] 14.1 Set up Socket.io client


    - Initialize Socket.io client connection
    - Implement JWT authentication for WebSocket
    - Handle connection and disconnection events
    - Implement reconnection logic


    - _Requirements: 7.1_
  - [x] 14.2 Create chat room component





    - Build chat interface with message list
    - Display messages with sender names and timestamps


    - Auto-scroll to latest message
    - Show typing indicators
    - _Requirements: 7.3, 7.4_
  - [x] 14.3 Implement message sending


    - Create message input component
    - Send messages via WebSocket
    - Display sent messages immediately


    - Handle send failures
    - _Requirements: 7.3_
  - [x] 14.4 Add chat notifications


    - Show unread message count badge
    - Display notification when new message arrives
    - Play notification sound (optional)
    - _Requirements: 8.4_
  - [x] 14.5 Load chat history




    - Fetch message history on room join
    - Implement pagination for old messages
    - Merge real-time messages with history
    --_Requirements: 7.5_

  - [x] 14.6 Write chat UI tests




    - Test message sending and receiving
    - Test chat history loading
    - Test notification display
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 15. Create notification UI






  - [x] 15.1 Build notification bell component


    - Display notification icon in header
    - Show unread count badge
    - Open notification dropdown on click
    - _Requirements: 8.1_
  - [x] 15.2 Create notification list


    - Display notifications in dropdown
    - Show notification type icons
    - Display notification title and message
    - Show timestamp for each notification
    - Mark as read on view
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 15.3 Implement notification actions


    - Add "Mark all as read" button
    - Add delete button for individual notifications
    - Link to related resources (activity, user)
    - _Requirements: 8.1_
  - [x] 15.4 Write notification UI tests



    - Test notification display
    - Test mark as read functionality
    - Test notification actions
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 16. Implement activity rating UI
  - [x] 16.1 Create rating prompt
    - Show rating dialog after activity completion
    - Display 5-star rating selector
    - Add optional feedback text area
    - Submit rating to backend
    - _Requirements: 9.1, 9.2_
  - [x] 16.2 Display ratings on profiles

    - Show average rating on activity creator's profile
    - Display rating count
    - Show individual ratings and feedback
    - _Requirements: 9.3, 9.4_

  - [x] 16.3 Show ratings in activity details

    - Display average rating on activity detail page
    - Show rating distribution
    - Display recent feedback
    - _Requirements: 9.5_

  - [x] 16.4 Write rating UI tests


    - Test rating submission
    - Test rating display
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 17. Implement responsive design and PWA features



  - [x] 17.1 Make UI responsive


    - Ensure all pages work on mobile (320px+)
    - Adjust layouts for tablet and desktop
    - Test on different screen sizes
    - Optimize touch interactions for mobile
    - _Requirements: 12.2_


  - [x] 17.2 Configure PWA
    - Create service worker for offline support
    - Add web app manifest
    - Configure caching strategies
    - Enable "Add to Home Screen" functionality
    - _Requirements: 12.4_
  - [x] 17.3 Optimize performance

    - Implement code splitting with React.lazy
    - Add image lazy loading
    - Optimize bundle size
    - Implement loading states
    - _Requirements: 10.1, 10.2_


  - [x] 17.4 Test PWA features

    - Test offline functionality
    - Test home screen installation
    - Test on iOS Safari
    - _Requirements: 12.4_

- [x] 18. Set up AWS infrastructure



  - [ ] 18.1 Configure AWS RDS PostgreSQL
    - Create RDS instance
    - Configure security groups
    - Set up database backups
    - Enable encryption at rest
    - _Requirements: 11.2_
  - [ ] 18.2 Set up AWS S3 for route data
    - Create S3 bucket
    - Configure bucket policies
    - Enable versioning
    - Set up lifecycle policies for data retention
    - _Requirements: 5.3_
  - [ ] 18.3 Configure AWS SNS for notifications
    - Create SNS topics
    - Set up subscriptions
    - Configure notification delivery
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 18.4 Set up AWS Lambda for scheduled tasks
    - Create Lambda function for activity reminders
    - Configure CloudWatch Events for scheduling
    - Set up IAM roles and permissions
    - _Requirements: 8.2, 8.3_
  - [ ] 18.5 Test AWS integrations
    - Test database connectivity
    - Test S3 file uploads
    - Test notification delivery
    - Test Lambda execution
    - _Requirements: 5.3, 8.2, 8.3, 11.2_

- [x] 19. Implement error handling and logging






  - [x] 19.1 Create error handling middleware

    - Implement centralized error handler
    - Format error responses consistently
    - Log errors with context
    - _Requirements: 10.4_


  - [x] 19.2 Add frontend error boundaries
    - Create React error boundary components
    - Display user-friendly error messages
    - Log errors to monitoring service
    - _Requirements: 10.4_
  - [x] 19.3 Set up logging and monitoring

    - Configure AWS CloudWatch for logs
    - Set up error tracking with Sentry
    - Create CloudWatch alarms for critical errors
    - _Requirements: 10.2, 10.3_
  - [x] 19.4 Test error handling


    - Test API error responses
    - Test frontend error boundaries
    - Test error logging
    - _Requirements: 10.4_
-

- [ ] 20. Implement security measures





  - [x] 20.1 Add rate limiting



    - Implement rate limiting middleware
    - Configure limits for login attempts
    - Add rate limits for API endpoints

    - _Requirements: 1.5_
  - [x] 20.2 Configure CORS

    - Set up CORS middleware
    - Allow only trusted origins
    - Configure credentials handling
    - _Requirements: 11.1_


  - [ ] 20.3 Add input validation and sanitization
    - Validate all API inputs
    - Sanitize user inputs to prevent XSS
    - Use parameterized queries for SQL
    - _Requirements: 11.1_
  - [ ] 20.4 Implement HTTPS
    - Configure SSL/TLS certificates
    - Enforce HTTPS-only connections
    - Set up secure headers
    - _Requirements: 11.1_
  - [ ] 20.5 Perform security testing
    - Test authentication and authorization
    - Test input validation
    - Test for common vulnerabilities
    - _Requirements: 11.1, 11.2_


- [x] 21. Deploy to staging environment


  - [ ] 21.1 Set up staging infrastructure
    - Configure AWS Elastic Beanstalk for backend
    - Set up AWS Amplify for frontend
    - Configure environment variables
    - _Requirements: 10.1_
  - [ ] 21.2 Deploy backend to staging
    - Build Docker image
    - Deploy to Elastic Beanstalk
    - Run database migrations
    - Verify deployment
    - _Requirements: 10.1_
  - [ ] 21.3 Deploy frontend to staging
    - Build production bundle
    - Deploy to AWS Amplify
    - Configure CloudFront CDN
    - Verify deployment
    - _Requirements: 10.1, 12.1_
  - [ ] 21.4 Perform staging tests
    - Run E2E tests on staging
    - Test all critical user flows
    - Verify performance metrics
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 22. Conduct end-to-end testing
  - [ ] 22.1 Set up E2E testing framework
    - Install and configure Playwright or Cypress
    - Create test utilities and helpers
    - Set up test data seeding
    - _Requirements: 10.1_
  - [ ] 22.2 Write critical user flow tests
    - Test user registration and login flow
    - Test activity creation and joining flow
    - Test GPS tracking and route recording flow
    - Test chat and notification flow
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 7.3, 8.1_
  - [ ] 22.3 Test cross-browser compatibility
    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile browsers (iOS Safari, Chrome Mobile)
    - Verify responsive design on different screen sizes
    - _Requirements: 12.1, 12.2_
  - [ ] 22.4 Perform load testing
    - Set up load testing with Artillery or k6
    - Test with 100, 500, 1000 concurrent users
    - Measure API response times
    - Test WebSocket connection stability
    - _Requirements: 10.3_

- [ ] 23. Prepare for production deployment
  - [ ] 23.1 Set up production infrastructure
    - Configure production RDS instance with read replicas
    - Set up auto-scaling for backend (2-10 instances)
    - Configure production S3 buckets
    - Set up production CloudFront distribution
    - _Requirements: 10.3_
  - [ ] 23.2 Configure monitoring and alerts
    - Set up CloudWatch dashboards
    - Configure alarms for error rates and performance
    - Set up Sentry for production error tracking
    - Create custom dashboard for WAU/MAU metrics
    - _Requirements: 10.2, 10.3_
  - [ ] 23.3 Create deployment documentation
    - Document deployment process
    - Create rollback procedures
    - Document environment variables
    - Create troubleshooting guide
    - _Requirements: 10.1_
  - [ ] 23.4 Deploy to production
    - Deploy backend to production Elastic Beanstalk
    - Deploy frontend to production Amplify
    - Run database migrations
    - Verify all services are running
    - Monitor for errors
    - _Requirements: 10.1_
