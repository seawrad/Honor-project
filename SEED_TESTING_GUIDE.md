# Seed Data Testing Guide

This guide explains how to use the mock data to test the Group Running App.

## Prerequisites

1. **Start Docker** and run: `docker-compose up -d` (PostgreSQL must be running)
2. **Migrate database:** `npm run migrate --workspace=backend`
3. **Run seed:** `npm run seed --workspace=backend`
4. **Start app:** `npm run dev` (backend + frontend)

## Run the Seed

```bash
npm run seed --workspace=backend
```

This will **replace** existing test users (alice, bob, carol, dave) and all their data with fresh mock data.

---

## Login Credentials

| Email | Password | Display Name | Use For |
|-------|----------|--------------|---------|
| alice@test.com | Test1234! | Alice Chen | Activity creator, has upcoming & completed activities |
| bob@test.com | Test1234! | Bob Wong | Activity creator, participant, chat user |
| carol@test.com | Test1234! | Carol Lee | Participant, follower/following relationships |
| dave@test.com | Test1234! | Dave Lam | Participant, route history |

**All 4 accounts use the same password: `Test1234!`**

---

## What Data Tests What Feature

### 1. Login & Registration
- **Use:** alice@test.com / Test1234!
- **Test:** Login page, JWT auth, protected routes
- **Also:** Try registering a new user (e.g. eva@test.com) to test registration flow

### 2. Activity List & Discovery
- **Use:** Any logged-in account
- **Test:** `/activities` — Should show 5 activities (3 upcoming, 2 completed)
  - Morning Jog - Victoria Park (upcoming)
  - Evening Run - Kowloon Park (upcoming)
  - Weekend Long Run - Stanley (upcoming)
  - Central Harbour Run (completed)
  - Tai Tam Reservoir Trail (completed)
- **Test:** Search, filters, sort by date/location

### 3. Activity Detail & Join/Leave
- **Use:** carol@test.com (already in some, not in others)
- **Test:** `/activities/:id` — View details, join/leave buttons
- **Test:** Activities at max capacity (if any) show "full" status

### 4. Create / Edit / Cancel Activity
- **Use:** alice@test.com or bob@test.com
- **Test:** `/activities/create` — Create new activity
- **Test:** Edit or cancel an activity you created

### 5. User Profiles & Follow System
- **Use:** alice@test.com → visit `/users/:userId` for Bob, Carol, Dave
- **Test:** Profile shows total runs, distance, average rating
- **Test:** Follow/Unfollow button
- **Test:** `/users/search` — Search "Alice", "Bob", etc.
- **Test:** `/users/:userId/followers` and `/users/:userId/following`

### 6. Activity Feed (Following)
- **Use:** alice@test.com
- **Test:** `/feed` — Shows activities from users Alice follows (Bob, Carol, Dave)

### 7. Chat
- **Use:** alice@test.com and bob@test.com (open two browsers or incognito)
- **Test:** `/activities/:activityId/chat` — For "Morning Jog", "Evening Run", or "Central Harbour Run"
- **Test:** Real-time messages (4 sample messages already in Morning Jog chat)
- **Test:** Send new messages and see them appear in the other session

### 8. Notifications
- **Use:** alice@test.com
- **Test:** Notification bell in header — Should show unread notifications (activity reminder, chat message)
- **Use:** carol@test.com — Has "new follower" and "activity joined" notifications
- **Test:** Mark as read, notification dropdown

### 9. Ratings & Feedback
- **Use:** alice@test.com
- **Test:** Go to a completed activity (Central Harbour Run or Tai Tam Reservoir Trail)
- **Test:** View ratings (Alice and Bob rated Central Harbour Run; Carol and Dave rated Tai Tam)
- **Test:** Submit a new rating if you haven’t already (as participant)
- **Test:** User profile shows average rating (e.g. Bob's profile)

### 10. GPS Tracking
- **Use:** Any account
- **Test:** Join an upcoming activity → `/activities/:activityId/tracking`
- **Test:** Start recording, move around (or simulate), stop and save
- **Note:** Seed data has route records with metrics only (no GPS track). Real GPS data is created when you record a run.

### 11. Route History
- **Use:** alice@test.com or bob@test.com (have completed routes)
- **Test:** `/routes/history` — Shows past routes with distance, speed, duration
- **Note:** Routes from seed have metrics but no map track (positions_s3_key is null for local testing)

### 12. PWA & Offline
- **Test:** Add to home screen (mobile or desktop)
- **Test:** Go offline — static pages should load from cache
- **Test:** Offline page when navigating while offline

---

## Quick Test Scenario

1. **Login** as alice@test.com
2. Go to **Activity List** — see 5 activities
3. Open **Morning Jog** → see participants, chat link
4. Open **Chat** for Morning Jog — see 4 messages
5. Open **Profile** of Bob — see stats, follow button
6. Go to **Feed** — see activities from followed users
7. Open **Notifications** — see reminders and chat alerts
8. Open **Central Harbour Run** (completed) — see ratings
9. **Logout**, login as bob@test.com, repeat key flows

---

## Reset Seed Data

To get a clean set of mock data again:

```bash
npm run seed --workspace=backend
```

This removes the 4 test users and all their related data, then re-inserts fresh mock data.
