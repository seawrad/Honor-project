# Requirements Document

## Introduction

The Group Running App is a health-tech web application, implemented as a responsive Progressive Web App (PWA), designed to facilitate social running activities by enabling users to create, discover, and participate in group running sessions. The system targets adults aged 18-65 who own smartphones and are interested in running with social motivation. The application leverages GPS tracking, real-time notifications, and social interaction features to build an active running community. The primary implementation and evaluation in this FYP focus on the web PWA version; a potential iOS native application is considered as future work and is **not** within the current implementation scope.

## Glossary

- **System**: The Group Running App (web and future iOS application)
- **User**: A registered individual aged 18-65 who uses the System to participate in running activities
- **Activity**: A scheduled group running session with defined parameters (time, location, route, distance)
- **Activity Creator**: A User who initiates and manages an Activity
- **Activity Participant**: A User who joins an existing Activity
- **GPS Module**: The component responsible for tracking location, route, distance, and speed
- **Notification Service**: The component that sends alerts and reminders to Users
- **Profile**: A User's account information including running history, preferences, and social connections
- **Chat Room**: An in-app messaging space associated with a specific Activity
- **Backend Service**: AWS-based server infrastructure handling data storage and processing
- **WAU**: Weekly Active Users
- **MAU**: Monthly Active Users

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a potential user, I want to register and log into the app securely, so that I can access personalized features and maintain my running history.

#### Acceptance Criteria

1. THE System SHALL provide a registration form that collects email address, password, display name, age, and consent to terms of service
2. WHEN a User submits registration with age outside the range of 18 to 65, THE System SHALL reject the registration and display an age restriction message
3. THE System SHALL encrypt User passwords using industry-standard hashing algorithms before storage
4. WHEN a User enters valid credentials, THE System SHALL authenticate the User and grant access to the main interface within 3 seconds
5. IF authentication fails due to incorrect credentials, THEN THE System SHALL display an error message and allow retry after 2 seconds

### Requirement 2: Activity Creation and Management

**User Story:** As an activity creator, I want to create and manage running activities with specific details, so that other users can find and join runs that match their preferences.

#### Acceptance Criteria

1. THE System SHALL provide an activity creation form that accepts date, time, location, route description, distance, and maximum participant count
2. WHEN an Activity Creator submits a complete activity form, THE System SHALL save the Activity to the Backend Service and display a confirmation within 2 seconds
3. THE System SHALL allow an Activity Creator to edit Activity details up to 1 hour before the scheduled start time
4. THE System SHALL allow an Activity Creator to cancel an Activity at any time before the scheduled start time
5. WHEN an Activity Creator cancels an Activity, THE System SHALL notify all registered Activity Participants within 5 minutes

### Requirement 3: Activity Discovery and Search

**User Story:** As a user, I want to discover available running activities near my location, so that I can find suitable runs to join.

#### Acceptance Criteria

1. THE System SHALL display a list of upcoming Activities sorted by proximity to the User's current location
2. WHEN a User applies search filters for date, distance range, or location radius, THE System SHALL update the Activity list within 2 seconds
3. THE System SHALL display Activity details including creator name, scheduled time, location, distance, current participant count, and maximum capacity
4. THE System SHALL indicate when an Activity has reached maximum capacity
5. WHEN a User selects an Activity from the list, THE System SHALL display the full Activity details page

### Requirement 4: Activity Participation

**User Story:** As a user, I want to join and leave running activities, so that I can participate in group runs that fit my schedule.

#### Acceptance Criteria

1. WHEN a User requests to join an Activity that has not reached maximum capacity, THE System SHALL register the User as an Activity Participant and send a confirmation
2. IF an Activity has reached maximum capacity, THEN THE System SHALL prevent additional Users from joining and display a "full" status message
3. THE System SHALL allow an Activity Participant to leave an Activity up to 1 hour before the scheduled start time
4. WHEN an Activity Participant leaves an Activity, THE System SHALL update the participant count and notify the Activity Creator within 5 minutes
5. THE System SHALL display a list of all Activities that a User has joined in the User's Profile

### Requirement 5: GPS Tracking and Route Recording

**User Story:** As an activity participant, I want the app to track my running route and performance metrics, so that I can review my progress and share results with others.

#### Acceptance Criteria

1. WHEN a User starts an Activity, THE System SHALL activate the GPS Module and begin recording location data at 1-second intervals
2. WHILE an Activity is in progress, THE System SHALL calculate and display real-time distance, speed, and elapsed time
3. WHEN a User completes an Activity, THE System SHALL save the route data, total distance, average speed, and duration to the Backend Service
4. THE System SHALL generate a visual map representation of the recorded route within 5 seconds of Activity completion
5. THE System SHALL allow Users to view their historical route data and performance metrics in their Profile

### Requirement 6: Social Interaction and User Profiles

**User Story:** As a user, I want to connect with other runners and view their profiles, so that I can build a running community and find regular running partners.

#### Acceptance Criteria

1. THE System SHALL allow a User to follow other Users and display a list of followers and following in the User's Profile
2. THE System SHALL display a User's Profile including display name, total runs completed, total distance, and recent Activities
3. WHEN a User views another User's Profile, THE System SHALL display public information excluding private contact details
4. THE System SHALL allow Users to search for other Users by display name
5. THE System SHALL display a feed of Activities created or joined by Users that a User follows

### Requirement 7: In-App Chat and Communication

**User Story:** As an activity participant, I want to communicate with other participants before and during a run, so that we can coordinate meeting points and stay connected.

#### Acceptance Criteria

1. WHEN an Activity is created, THE System SHALL automatically create a Chat Room associated with that Activity
2. THE System SHALL grant access to the Chat Room only to the Activity Creator and registered Activity Participants
3. WHEN a User sends a message in a Chat Room, THE System SHALL deliver the message to all Chat Room members within 2 seconds
4. THE System SHALL display message timestamps and sender names in the Chat Room
5. THE System SHALL retain Chat Room messages for 7 days after the Activity completion date

### Requirement 8: Notifications and Reminders

**User Story:** As a user, I want to receive timely notifications about my activities and social interactions, so that I don't miss important updates.

#### Acceptance Criteria

1. WHEN a User joins an Activity, THE System SHALL send a confirmation notification immediately
2. THE System SHALL send a reminder notification to all Activity Participants 24 hours before the scheduled Activity start time
3. THE System SHALL send a reminder notification to all Activity Participants 1 hour before the scheduled Activity start time
4. WHEN a User receives a new Chat Room message, THE System SHALL send a notification within 10 seconds
5. WHEN a User is followed by another User, THE System SHALL send a notification within 1 minute

### Requirement 9: Post-Activity Rating and Feedback

**User Story:** As an activity participant, I want to rate and provide feedback on completed runs, so that I can share my experience and help others make informed decisions.

#### Acceptance Criteria

1. WHEN an Activity is completed, THE System SHALL prompt all Activity Participants to provide a rating from 1 to 5 stars
2. THE System SHALL allow Activity Participants to submit optional text feedback up to 500 characters
3. THE System SHALL calculate and display the average rating for each completed Activity
4. THE System SHALL display ratings and feedback on the Activity Creator's Profile
5. THE System SHALL allow Users to view ratings and feedback for Activities before joining similar future Activities

### Requirement 10: System Performance and Stability

**User Story:** As a user, I want the app to be fast and reliable, so that I can have a smooth experience without interruptions.

#### Acceptance Criteria

1. THE System SHALL load the main interface within 3 seconds of User authentication
2. THE System SHALL maintain a crash rate below 1% of all user sessions
3. WHEN the Backend Service experiences high load with 1000 concurrent Users, THE System SHALL maintain response times below 5 seconds for all operations
4. THE System SHALL provide error messages with clear descriptions when operations fail
5. THE System SHALL automatically retry failed Backend Service requests up to 3 times before displaying an error to the User

### Requirement 11: Data Privacy and Security

**User Story:** As a user, I want my personal information and location data to be protected, so that I can use the app with confidence.

#### Acceptance Criteria

1. THE System SHALL encrypt all data transmissions between the client and Backend Service using TLS 1.2 or higher
2. THE System SHALL store User location data only with explicit User consent
3. THE System SHALL allow Users to delete their account and all associated data through the Profile settings
4. WHEN a User deletes their account, THE System SHALL remove all personal data from the Backend Service within 30 days
5. THE System SHALL comply with data protection regulations by providing a privacy policy accessible from the registration and settings pages

### Requirement 12: Cross-Platform Web Implementation

**User Story:** As a developer, I want to build the app as a web application first, so that I can test all features on Windows before deploying to iOS.

#### Acceptance Criteria

1. THE System SHALL be implemented as a responsive web application compatible with Chrome, Firefox, Safari, and Edge browsers
2. THE System SHALL provide a mobile-responsive interface that adapts to screen sizes from 320px to 1920px width
3. THE System SHALL utilize web-based GPS APIs to access device location services
4. THE System SHALL implement Progressive Web App (PWA) features to enable offline capability and home screen installation
5. THE System SHALL maintain feature parity between the web version and the planned iOS native application
