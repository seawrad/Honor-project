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
| alice@test.com | Test1234! | Alice Chen | Activity creator, many upcoming & completed, rich feed |
| bob@test.com | Test1234! | Bob Wong | Activity creator, participant, chat, route history |
| carol@test.com | Test1234! | Carol Lee | Participant, many follows, notifications |
| dave@test.com | Test1234! | Dave Lam | Participant, route history |
| eva@test.com | Test1234! | Eva Tang | Creator of full activity, Sha Tin run |
| frank@test.com | Test1234! | Frank Liu | Creator of empty/new activity, first-timer run |

**All 6 accounts use the same password: `Test1234!`**

---

## What Data Tests What Feature

### 1. Login & Registration
- **Use:** alice@test.com / Test1234!
- **Test:** Login page, JWT auth, protected routes
- **Also:** Try registering a new user (e.g. eva@test.com) to test registration flow

### 2. Activity List & Discovery
- **Use:** Any logged-in account
- **Test:** `/activities` — Should show 10 activities (6 upcoming, 3 completed, 1 cancelled)
  - Morning Jog - Victoria Park (upcoming, 3 participants)
  - Evening Run - Kowloon Park (upcoming)
  - Weekend Long Run - Stanley (upcoming)
  - Sunrise Run - West Kowloon (upcoming, **FULL** – 4/4)
  - Discovery Bay Trail (upcoming, 5 participants)
  - First Timer Friendly - 2K (upcoming, **only creator** – good for "new/empty" UI)
  - Central Harbour Run (completed)
  - Tai Tam Reservoir Trail (completed)
  - Sha Tin Riverside Run (completed)
  - Rain Cancelled - Repo Bay (**cancelled**)
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
- **Test:** `/activities/:activityId/chat` — 7 activities have chat messages:
  - Morning Jog (6 messages), Evening Run (2), Weekend Long Run (3)
  - Sunrise Run (2), First Timer Friendly (1)
  - Central Harbour Run (2), Sha Tin Riverside Run (3)
- **Test:** Real-time messages
- **Test:** Send new messages and see them appear in the other session

### 8. Notifications
- **Use:** alice@test.com — 3 unread (activity reminder, chat message, new follower)
- **Use:** carol@test.com — 2 unread (new follower, chat message)
- **Use:** eva@test.com — 1 unread (activity reminder)
- **Use:** frank@test.com — 2 unread (new follower, activity reminder)
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
- **Use:** alice@test.com, bob@test.com, carol@test.com, dave@test.com, eva@test.com, frank@test.com
- **Test:** `/routes/history` — Alice & Bob: Central Harbour + Sha Tin; Carol & Dave: Tai Tam; Eva & Frank: Sha Tin
- **Note:** Routes from seed have metrics but no map track (positions_s3_key is null for local testing)

### 12. PWA & Offline
- **Test:** Add to home screen (mobile or desktop)
- **Test:** Go offline — static pages should load from cache
- **Test:** Offline page when navigating while offline

---

## Quick Test Scenario

1. **Login** as alice@test.com
2. Go to **Activity List** — see 10 activities (including cancelled, full, empty)
3. Open **Morning Jog** → see participants, chat link
4. Open **Sunrise Run** → see **FULL** status (4/4)
5. Open **First Timer Friendly** → see only Frank (creator)
6. Open **Chat** for Morning Jog — see 6 messages
7. Open **Profile** of Eva or Frank — see stats
8. Go to **Feed** — see activities from followed users (alice follows 5 people)
9. Open **Notifications** — see 3 unread
10. Open **Central Harbour Run** (completed) — see ratings
11. Go to **Rain Cancelled** — see cancelled status
12. **Logout**, login as frank@test.com → test empty activity, first-timer flow

---

## Reset Seed Data

To get a clean set of mock data again:

```bash
npm run seed --workspace=backend
```

This removes the 6 test users and all their related data, then re-inserts fresh mock data.

---

## Suggested Next Steps (Based on Mock Data Coverage)

| Area | Current Coverage | Possible Next Step |
|------|------------------|--------------------|
| **Activity filters** | Date range, status, distance | Add geo/radius filter, test with varied locations |
| **Activity capacity** | Full (4/4), empty (1/5) | Ensure "Join" disabled when full, empty state UI |
| **Cancelled activities** | 1 cancelled | Filter/hide cancelled, show cancellation reason |
| **Chat list** | 7 activities with messages | Sort by last message, unread badge |
| **User search** | 6 users | Search by display name, pagination |
| **Feed** | Alice follows 5 users | Infinite scroll, empty feed handling |
| **Route history** | 7 route records across users | Map placeholder when no GPS track |
| **Notifications** | 12 notifications, 4 types | Notification preferences, mark all read |
