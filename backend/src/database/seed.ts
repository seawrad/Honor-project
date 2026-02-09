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
  eva: '55555555-5555-5555-5555-555555555555',
  frank: '66666666-6666-6666-6666-666666666666',
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Remove existing test users (CASCADE will remove their activities, etc.)
  console.log('Cleaning existing test data...')
  await db.query(
    `DELETE FROM users WHERE email IN ('alice@test.com', 'bob@test.com', 'carol@test.com', 'dave@test.com', 'eva@test.com', 'frank@test.com')`
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
       ($5, 'dave@test.com', $2, 'Dave Lam', 42, true),
       ($6, 'eva@test.com', $2, 'Eva Tang', 31, true),
       ($7, 'frank@test.com', $2, 'Frank Liu', 26, true)
     `,
    [USER_IDS.alice, passwordHash, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave, USER_IDS.eva, USER_IDS.frank]
  )
  console.log('✓ 6 users created (alice, bob, carol, dave, eva, frank)')

  // 2. Activities (mix of upcoming, completed, cancelled; varied edge cases)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const in3Days = new Date(now)
  in3Days.setDate(in3Days.getDate() + 3)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date(now)
  nextMonth.setDate(nextMonth.getDate() + 30)
  const lastWeek = new Date(now)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  console.log('Creating activities...')
  const activitiesResult = await db.query(
    `INSERT INTO activities (creator_id, title, description, scheduled_date, latitude, longitude, address, route, distance, max_participants, status)
     VALUES 
       ($1, 'Morning Jog - Victoria Park', '5K easy run around the park', $2, 22.2793, 114.1861, 'Victoria Park, Causeway Bay', NULL, 5.0, 10, 'upcoming'),
       ($3, 'Evening Run - Kowloon Park', 'Quick 3K after work', $2, 22.3121, 114.1712, 'Kowloon Park, TST', NULL, 3.0, 8, 'upcoming'),
       ($1, 'Weekend Long Run - Stanley', '10K scenic run along the waterfront', $4, 22.2186, 114.2119, 'Stanley Promenade', NULL, 10.0, 15, 'upcoming'),
       ($5, 'Sunrise Run - West Kowloon', '6K early morning run by the harbour', $6, 22.3040, 114.1607, 'West Kowloon Promenade', NULL, 6.0, 4, 'upcoming'),
       ($3, 'Discovery Bay Trail', '12K coastal trail, bring water!', $4, 22.2923, 114.0181, 'Discovery Bay Pier', NULL, 12.0, 20, 'upcoming'),
       ($7, 'First Timer Friendly - 2K', 'Short run for beginners, no pressure', $8, 22.3193, 114.1694, 'Tsim Sha Tsui Promenade', NULL, 2.0, 5, 'upcoming'),
       ($3, 'Central Harbour Run', '7K with harbour views', $9, 22.2815, 114.1582, 'Central Pier', NULL, 7.0, 12, 'completed'),
       ($1, 'Tai Tam Reservoir Trail', '8K trail run', $9, 22.2639, 114.2192, 'Tai Tam Reservoir', NULL, 8.0, 6, 'completed'),
       ($5, 'Sha Tin Riverside Run', '10K along Shing Mun River', $10, 22.3871, 114.1994, 'Sha Tin Park', NULL, 10.0, 8, 'completed'),
       ($1, 'Rain Cancelled - Repo Bay', 'Rescheduled due to weather', $10, 22.2670, 114.2330, 'Repulse Bay', NULL, 5.0, 6, 'cancelled')
     RETURNING id, title, creator_id, status`,
    [
      USER_IDS.alice, tomorrow, USER_IDS.bob, nextWeek, USER_IDS.eva, in3Days, USER_IDS.frank, nextMonth,
      lastWeek, twoWeeksAgo,
    ]
  )

  const activities = activitiesResult.rows
  const upcoming1 = activities[0]  // Morning Jog - Victoria Park
  const upcoming2 = activities[1]  // Evening Run - Kowloon Park
  const upcoming3 = activities[2]  // Weekend Long Run - Stanley
  const upcomingFull = activities[3]  // Sunrise Run - West Kowloon (max 4)
  const upcoming4 = activities[4]  // Discovery Bay Trail
  const upcomingEmpty = activities[5]  // First Timer Friendly (no participants yet)
  const completed1 = activities[6]  // Central Harbour Run
  const completed2 = activities[7]  // Tai Tam Reservoir Trail
  const completed3 = activities[8]  // Sha Tin Riverside Run
  const cancelled1 = activities[9]

  console.log('✓ 10 activities created (6 upcoming, 3 completed, 1 cancelled)')

  // 3. Activity participants
  console.log('Creating activity participants...')
  await db.query(
    `INSERT INTO activity_participants (activity_id, user_id)
     VALUES 
       ($1, $2), ($1, $3), ($1, $4),
       ($5, $3), ($5, $4),
       ($6, $3), ($6, $4), ($6, $7),
       ($8, $2), ($8, $3), ($8, $4), ($8, $9),
       ($10, $2), ($10, $3), ($10, $4), ($10, $9), ($10, $11),
       ($12, $11),
       ($13, $2), ($13, $3),
       ($14, $4), ($14, $7),
       ($15, $3), ($15, $9), ($15, $11),
       ($16, $2), ($16, $3)
     ON CONFLICT (activity_id, user_id) DO NOTHING`,
    [
      upcoming1.id, USER_IDS.alice, USER_IDS.bob, USER_IDS.carol,
      upcoming2.id, upcoming3.id, USER_IDS.dave,
      upcomingFull.id, USER_IDS.eva,
      upcoming4.id, USER_IDS.frank,
      upcomingEmpty.id,
      completed1.id, completed2.id, completed3.id, cancelled1.id,
    ]
  )
  console.log('✓ Activity participants assigned')

  // 4. Social connections (follow relationships)
  console.log('Creating follow relationships...')
  await db.query(
    `INSERT INTO social_connections (follower_id, following_id)
     VALUES 
       ($1, $2), ($1, $3), ($1, $4), ($1, $5), ($1, $6),
       ($2, $1), ($2, $3), ($2, $5),
       ($3, $1), ($3, $2), ($3, $4),
       ($4, $1), ($4, $2), ($4, $3),
       ($5, $1), ($5, $2), ($5, $3),
       ($6, $1), ($6, $2), ($6, $5)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [USER_IDS.alice, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave, USER_IDS.eva, USER_IDS.frank]
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

  // Add chat messages to multiple activities (varied conversation lengths)
  const chatSeeds = [
    { act: upcoming1, msgs: [
      ['Looking forward to the run!', USER_IDS.alice],
      ['See you there!', USER_IDS.bob],
      ['What time shall we meet at the entrance?', USER_IDS.alice],
      ['How about 10 minutes before start?', USER_IDS.bob],
      ['Perfect, I will bring some water to share', USER_IDS.carol],
      ['Thanks Carol! Weather looks good tomorrow', USER_IDS.alice],
    ]},
    { act: upcoming2, msgs: [
      ['Anyone want to grab coffee after?', USER_IDS.bob],
      ['Count me in!', USER_IDS.carol],
    ]},
    { act: upcoming3, msgs: [
      ['12K - make sure to hydrate!', USER_IDS.bob],
      ['Will there be water stations?', USER_IDS.carol],
      ['Yes, at km 4 and 8', USER_IDS.bob],
    ]},
    { act: upcomingFull, msgs: [
      ['We are full! Excited for Saturday', USER_IDS.eva],
      ['Me too, see you all at the promenade', USER_IDS.alice],
    ]},
    { act: upcomingEmpty, msgs: [
      ['First run here - anyone joining? Beginners welcome!', USER_IDS.frank],
    ]},
    { act: completed1, msgs: [
      ['Great run everyone!', USER_IDS.alice],
      ['Thanks for organising!', USER_IDS.bob],
    ]},
    { act: completed3, msgs: [
      ['Nice route along the river', USER_IDS.bob],
      ['The sunset was amazing', USER_IDS.eva],
      ['Let us do Sha Tin again next month', USER_IDS.frank],
    ]},
  ]
  for (const { act, msgs } of chatSeeds) {
    const roomId = roomByActivity.get(act.id)
    if (roomId) {
      for (const [content, senderId] of msgs) {
        await db.query(
          'INSERT INTO chat_messages (chat_room_id, sender_id, content) VALUES ($1, $2, $3)',
          [roomId, senderId, content]
        )
      }
    }
  }
  console.log('✓ Chat rooms and sample messages created')

  // 6. Notifications (varied types, read/unread)
  console.log('Creating notifications...')
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, related_id, is_read)
     VALUES 
       ($1, 'activity_reminder', '活動提醒', 'Morning Jog - Victoria Park 將於明日舉行', $2, false),
       ($1, 'chat_message', '新訊息', 'Bob Wong 在 Morning Jog 活動中發送了訊息', $2, false),
       ($1, 'new_follower', '新追蹤者', 'Frank Liu 開始追蹤你', NULL, false),
       ($3, 'activity_joined', '加入成功', '你已成功加入 Evening Run - Kowloon Park', $4, true),
       ($3, 'new_follower', '新追蹤者', 'Alice Chen 開始追蹤你', NULL, false),
       ($3, 'chat_message', '新訊息', 'Bob Wong 在 Evening Run 活動中發送了訊息', $4, false),
       ($5, 'activity_reminder', '活動提醒', 'Central Harbour Run 即將開始', $6, true),
       ($5, 'chat_message', '新訊息', 'Alice Chen 在 Central Harbour Run 活動中發送了訊息', $6, true),
       ($7, 'activity_reminder', '活動提醒', 'Sunrise Run - West Kowloon 將於三天後舉行', $8, false),
       ($9, 'new_follower', '新追蹤者', 'Bob Wong 開始追蹤你', NULL, false),
       ($9, 'activity_joined', '加入成功', '你已成功加入 Sha Tin Riverside Run', $10, true),
       ($11, 'activity_reminder', '活動提醒', 'First Timer Friendly - 2K 將於一個月後舉行', $12, false)
     `,
    [
      USER_IDS.alice, upcoming1.id,
      USER_IDS.carol, upcoming2.id,
      USER_IDS.bob, completed1.id,
      USER_IDS.eva, upcomingFull.id,
      USER_IDS.frank, completed3.id,
      USER_IDS.frank, upcomingEmpty.id,
    ]
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
       ($4, $6, 4, 'Challenging but fun.'),
       ($7, $3, 5, 'Perfect riverside path, will come back.'),
       ($7, $8, 4, 'Loved the sunset view.'),
       ($7, $9, 5, 'My first 10K, thanks for the encouragement!')
     ON CONFLICT (activity_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, feedback = EXCLUDED.feedback`,
    [completed1.id, USER_IDS.alice, USER_IDS.bob, completed2.id, USER_IDS.carol, USER_IDS.dave, completed3.id, USER_IDS.eva, USER_IDS.frank]
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
  const completed3Start = new Date(completedStart.getTime() + 172800000)
  const completed3End = new Date(completed3Start.getTime() + 3600000)

  await db.query(
    `INSERT INTO routes (activity_id, user_id, total_distance, average_speed, duration, start_time, end_time, positions_s3_key)
     VALUES 
       ($1, $2, 7.2, 9.6, 2700, $3, $4, NULL),
       ($1, $5, 6.8, 9.1, 2700, $3, $4, NULL),
       ($6, $7, 8.1, 8.5, 3600, $8, $9, NULL),
       ($6, $10, 7.9, 7.9, 3600, $8, $9, NULL),
       ($11, $5, 10.2, 9.2, 3960, $12, $13, NULL),
       ($11, $14, 9.8, 8.9, 3960, $12, $13, NULL),
       ($11, $15, 10.5, 8.7, 3960, $12, $13, NULL)`,
    [
      completed1.id, USER_IDS.alice, completedStart, completedEnd, USER_IDS.bob,
      completed2.id, USER_IDS.carol, completed2Start, completed2End, USER_IDS.dave,
      completed3.id, completed3Start, completed3End, USER_IDS.eva, USER_IDS.frank,
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
