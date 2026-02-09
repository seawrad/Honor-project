/**
 * Seed script - Populates database with mock data for testing
 * Run: npm run seed --workspace=backend
 */
import bcrypt from 'bcrypt'
import { db } from './db.js'

const SALT_ROUNDS = 10
const TEST_PASSWORD = 'Test1234!'

// Fixed UUIDs for predictable references in testing guide
const USER_IDS = {
  alice: '11111111-1111-1111-1111-111111111111',
  bob: '22222222-2222-2222-2222-222222222222',
  carol: '33333333-3333-3333-3333-333333333333',
  dave: '44444444-4444-4444-4444-444444444444',
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Remove existing test users (CASCADE will remove their activities, etc.)
  console.log('Cleaning existing test data...')
  await db.query(
    `DELETE FROM users WHERE email IN ('alice@test.com', 'bob@test.com', 'carol@test.com', 'dave@test.com')`
  )
  console.log('✓ Cleaned')

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS)

  // 1. Users
  console.log('Creating users...')
  await db.query(
    `INSERT INTO users (id, email, password_hash, display_name, age, agreed_to_terms)
     VALUES 
       ($1, 'alice@test.com', $2, 'Alice Chen', 28, true),
       ($3, 'bob@test.com', $2, 'Bob Wong', 35, true),
       ($4, 'carol@test.com', $2, 'Carol Lee', 24, true),
       ($5, 'dave@test.com', $2, 'Dave Lam', 42, true)
     `,
    [USER_IDS.alice, passwordHash, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave]
  )
  console.log('✓ 4 users created (alice@test.com, bob@test.com, carol@test.com, dave@test.com)')

  // 2. Activities (mix of upcoming and completed)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)

  console.log('Creating activities...')
  const activitiesResult = await db.query(
    `INSERT INTO activities (creator_id, title, description, scheduled_date, latitude, longitude, address, route, distance, max_participants, status)
     VALUES 
       ($1, 'Morning Jog - Victoria Park', '5K easy run around the park', $2, 22.2793, 114.1861, 'Victoria Park, Causeway Bay', NULL, 5.0, 10, 'upcoming'),
       ($3, 'Evening Run - Kowloon Park', 'Quick 3K after work', $4, 22.3121, 114.1712, 'Kowloon Park, TST', NULL, 3.0, 8, 'upcoming'),
       ($1, 'Weekend Long Run - Stanley', '10K scenic run along the waterfront', $5, 22.2186, 114.2119, 'Stanley Promenade', NULL, 10.0, 15, 'upcoming'),
       ($3, 'Central Harbour Run', '7K with harbour views', $6, 22.2815, 114.1582, 'Central Pier', NULL, 7.0, 12, 'completed'),
       ($1, 'Tai Tam Reservoir Trail', '8K trail run', $7, 22.2639, 114.2192, 'Tai Tam Reservoir', NULL, 8.0, 6, 'completed')
     RETURNING id, title, creator_id, status`,
    [USER_IDS.alice, tomorrow, USER_IDS.bob, tomorrow, nextWeek, lastWeek, lastWeek]
  )

  const activities = activitiesResult.rows
  const upcoming1 = activities[0]
  const upcoming2 = activities[1]
  const upcoming3 = activities[2]
  const completed1 = activities[3]
  const completed2 = activities[4]

  console.log('✓ 5 activities created (3 upcoming, 2 completed)')

  // 3. Activity participants
  console.log('Creating activity participants...')
  await db.query(
    `INSERT INTO activity_participants (activity_id, user_id)
     VALUES 
       ($1, $2), ($1, $3), ($1, $4),
       ($5, $2), ($5, $4),
       ($6, $3), ($6, $4), ($6, $7),
       ($8, $2), ($8, $3),
       ($9, $3), ($9, $4)
     ON CONFLICT (activity_id, user_id) DO NOTHING`,
    [
      upcoming1.id, USER_IDS.alice, USER_IDS.bob, USER_IDS.carol,
      upcoming2.id, upcoming3.id, USER_IDS.dave,
      completed1.id, completed2.id,
    ]
  )
  console.log('✓ Activity participants assigned')

  // 4. Social connections (follow relationships)
  console.log('Creating follow relationships...')
  await db.query(
    `INSERT INTO social_connections (follower_id, following_id)
     VALUES 
       ($1, $2), ($1, $3), ($1, $4),
       ($2, $1), ($2, $3),
       ($3, $1), ($3, $2),
       ($4, $1), ($4, $2)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [USER_IDS.alice, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave]
  )
  console.log('✓ Follow relationships created')

  // 5. Chat rooms (one per activity) and chat messages
  console.log('Creating chat rooms and messages...')
  const chatRoomsResult = await db.query(
    `INSERT INTO chat_rooms (activity_id) 
     SELECT id FROM activities 
     ON CONFLICT (activity_id) DO UPDATE SET activity_id = EXCLUDED.activity_id
     RETURNING id, activity_id`
  )

  // Get chat room IDs by activity
  const roomByActivity = new Map<string, string>()
  for (const row of chatRoomsResult.rows) {
    roomByActivity.set(row.activity_id, row.id)
  }

  // Ensure chat rooms exist (activities may already have them)
  const allActivitiesResult = await db.query(
    'SELECT id FROM activities'
  )
  for (const act of allActivitiesResult.rows) {
    if (!roomByActivity.has(act.id)) {
      const insertResult = await db.query(
        'INSERT INTO chat_rooms (activity_id) VALUES ($1) RETURNING id',
        [act.id]
      )
      roomByActivity.set(act.id, insertResult.rows[0].id)
    }
  }

  // Add chat messages to first 3 activities
  const activitiesWithChat = [upcoming1, upcoming2, completed1]
  for (const act of activitiesWithChat) {
    const roomId = roomByActivity.get(act.id)
    if (roomId) {
      await db.query(
        `INSERT INTO chat_messages (chat_room_id, sender_id, content)
         VALUES 
           ($1, $2, 'Looking forward to the run!'),
           ($1, $3, 'See you there!'),
           ($1, $2, 'What time shall we meet at the entrance?'),
           ($1, $3, 'How about 10 minutes before start?')`,
        [roomId, USER_IDS.alice, USER_IDS.bob]
      )
    }
  }
  console.log('✓ Chat rooms and sample messages created')

  // 6. Notifications
  console.log('Creating notifications...')
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, related_id, is_read)
     VALUES 
       ($1, 'activity_reminder', '活動提醒', 'Morning Jog - Victoria Park 將於明日舉行', $2, false),
       ($1, 'chat_message', '新訊息', 'Bob Wong 在 Morning Jog 活動中發送了訊息', $2, false),
       ($3, 'activity_joined', '加入成功', '你已成功加入 Evening Run - Kowloon Park', $4, true),
       ($3, 'new_follower', '新追蹤者', 'Alice Chen 開始追蹤你', NULL, false),
       ($5, 'activity_reminder', '活動提醒', 'Central Harbour Run 即將開始', $6, true)`,
    [USER_IDS.alice, upcoming1.id, USER_IDS.carol, upcoming2.id, USER_IDS.bob, completed1.id]
  )
  console.log('✓ Notifications created')

  // 7. Activity ratings (for completed activities only)
  console.log('Creating activity ratings...')
  await db.query(
    `INSERT INTO activity_ratings (activity_id, user_id, rating, feedback)
     VALUES 
       ($1, $2, 5, 'Great route and weather!'),
       ($1, $3, 4, 'Enjoyed it, would join again.'),
       ($4, $5, 5, 'Best trail run so far!'),
       ($4, $6, 4, 'Challenging but fun.')
     ON CONFLICT (activity_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback`,
    [completed1.id, USER_IDS.alice, USER_IDS.bob, completed2.id, USER_IDS.carol, USER_IDS.dave]
  )
  console.log('✓ Activity ratings created')

  // 8. Routes (for completed activities - no S3 positions for local seed)
  console.log('Creating route records...')
  const completedStart = new Date(lastWeek)
  completedStart.setHours(8, 0, 0, 0)
  const completedEnd = new Date(completedStart)
  completedEnd.setMinutes(completedEnd.getMinutes() + 45)
  const completed2Start = new Date(completedStart.getTime() + 86400000)
  const completed2End = new Date(completedEnd.getTime() + 86400000)

  await db.query(
    `INSERT INTO routes (activity_id, user_id, total_distance, average_speed, duration, start_time, end_time, positions_s3_key)
     VALUES 
       ($1, $2, 7.2, 9.6, 2700, $3, $4, NULL),
       ($1, $5, 6.8, 9.1, 2700, $3, $4, NULL),
       ($6, $7, 8.1, 8.5, 3600, $8, $9, NULL),
       ($6, $10, 7.9, 7.9, 3600, $8, $9, NULL)`,
    [
      completed1.id, USER_IDS.alice, completedStart, completedEnd, USER_IDS.bob,
      completed2.id, USER_IDS.carol, completed2Start, completed2End, USER_IDS.dave,
    ]
  )
  console.log('✓ Route records created (metrics only, no GPS track for local testing)')

  console.log('')
  console.log('✅ Seed completed!')
  console.log('')
  console.log('See SEED_TESTING_GUIDE.md for login credentials and testing instructions.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
