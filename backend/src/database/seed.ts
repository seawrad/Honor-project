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
  dev: '77777777-7777-7777-7777-777777777777',
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Ensure achievements exist (migrations may have been skipped or table truncated)
  console.log('Ensuring achievements exist...')
  await db.query(`
    INSERT INTO achievements (code, name, name_zh, description, description_zh, icon, condition_type, condition_value, sort_order)
    VALUES
      ('first_run', 'First Run', '初跑者', 'Complete your first group run', '完成第一次團體跑', '🎯', 'total_runs', 1, 1),
      ('run_3', '3 Runs', '三跑入門', 'Complete 3 group runs', '完成 3 次團體跑', '🏅', 'total_runs', 3, 2),
      ('run_5', '5 Runs', '五跑達人', 'Complete 5 group runs', '完成 5 次團體跑', '🏃', 'total_runs', 5, 2),
      ('run_10', '10 Runs', '十跑健將', 'Complete 10 group runs', '完成 10 次團體跑', '💪', 'total_runs', 10, 3),
      ('run_25', '25 Runs', '跑團常客', 'Complete 25 group runs', '完成 25 次團體跑', '⭐', 'total_runs', 25, 4),
      ('run_50', '50 Runs', '半百跑者', 'Complete 50 group runs', '完成 50 次團體跑', '🌟', 'total_runs', 50, 5),
      ('run_100', '100 Runs', '百跑傳奇', 'Complete 100 group runs', '完成 100 次團體跑', '💎', 'total_runs', 100, 6),
      ('first_5k', 'First 5K', '初嘗五公里', 'Complete a 5km run', '完成一次 5 公里跑', '📏', 'single_run_km', 5, 10),
      ('first_10k', 'First 10K', '十公里解鎖', 'Complete a 10km run', '完成一次 10 公里跑', '🏆', 'single_run_km', 10, 11),
      ('first_half', 'Half Marathon', '半馬成就', 'Complete a 21km run', '完成一次 21 公里跑', '🎖️', 'single_run_km', 21, 12),
      ('first_marathon', 'Marathon', '全馬成就', 'Complete a 42km run', '完成一次 42 公里全馬', '🏅', 'single_run_km', 42, 13),
      ('total_50k', '50K Total', '累積五十公里', 'Run 50km total', '累積跑步 50 公里', '🛤️', 'total_distance_km', 50, 20),
      ('total_100k', '100K Total', '百公里達成', 'Run 100km total', '累積跑步 100 公里', '🦁', 'total_distance_km', 100, 21),
      ('total_250k', '250K Total', '累積兩百五十公里', 'Run 250km total', '累積跑步 250 公里', '🛤️', 'total_distance_km', 250, 23),
      ('total_500k', '500K Total', '五百公里大師', 'Run 500km total', '累積跑步 500 公里', '👑', 'total_distance_km', 500, 22),
      ('total_1000k', '1000K Total', '千公里大師', 'Run 1000km total', '累積跑步 1000 公里', '👑', 'total_distance_km', 1000, 24),
      ('week_streak_3', '3-Week Streak', '連續三週', 'Run in 3 consecutive weeks', '連續三週都有跑步', '🔥', 'weekly_streak', 3, 30),
      ('week_streak_4', '4-Week Streak', '連續四週', 'Run in 4 consecutive weeks', '連續四週都有跑步', '🔥', 'weekly_streak', 4, 31),
      ('week_streak_7', '7-Week Streak', '連續七週', 'Run in 7 consecutive weeks', '連續七週都有跑步', '🔥', 'weekly_streak', 7, 31),
      ('social_5', 'Social Runner', '社交跑者', 'Join 5 different activities', '參加 5 場不同活動', '👥', 'unique_activities', 5, 40),
      ('social_10', 'Super Social', '超級社交跑者', 'Join 10 different activities', '參加 10 場不同活動', '👥', 'unique_activities', 10, 41),
      ('early_bird', 'Early Bird', '晨跑者', 'Complete a run before 8am', '在早上 8 點前完成跑步', '🌅', 'early_run', 1, 50),
      ('memory_card', 'Memory Keeper', '記憶收藏家', 'Create your first run memory card', '建立第一張跑步記憶卡', '🃏', 'memory_cards', 1, 60),
      ('memory_card_5', '5 Memory Cards', '五張記憶卡', 'Create 5 run memory cards', '建立 5 張跑步記憶卡', '🃏', 'memory_cards', 5, 61),
      ('memory_card_10', '10 Memory Cards', '記憶卡收藏家', 'Create 10 run memory cards', '建立 10 張跑步記憶卡', '🃏', 'memory_cards', 10, 62),
      ('first_solo_run', 'Solo Runner', '獨跑初體驗', 'Complete your first solo run', '完成第一次獨跑', '🏃‍♂️', 'solo_runs', 1, 70)
    ON CONFLICT (code) DO NOTHING
  `)
  console.log('✓ Achievements ensured')

  // Remove existing test users (CASCADE will remove their activities, etc.)
  // Also remove mock users so re-seed produces consistent state
  console.log('Cleaning existing test data...')
  const mockEmails = Array.from({ length: 100 }, (_, i) => `mock${i + 1}@test.com`)
  const allTestEmails = [
    'alice@test.com', 'bob@test.com', 'carol@test.com', 'dave@test.com',
    'eva@test.com', 'frank@test.com', 'dev@test.com',
    ...mockEmails,
  ]
  await db.query(
    `DELETE FROM users WHERE email = ANY($1::text[])`,
    [allTestEmails]
  )
  console.log('✓ Cleaned')

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS)

  // 1. Users (with distinct avatar URLs from ui-avatars.com)
  console.log('Creating users...')
  const avatarUrls = [
    'https://ui-avatars.com/api/?name=Alice+Chen&size=150&background=00B8D4&color=fff',
    'https://ui-avatars.com/api/?name=Bob+Wong&size=150&background=0097A7&color=fff',
    'https://ui-avatars.com/api/?name=Carol+Lee&size=150&background=6EE0FF&color=0A2640',
    'https://ui-avatars.com/api/?name=Dave+Lam&size=150&background=FFD34E&color=0A2640',
    'https://ui-avatars.com/api/?name=Eva+Tang&size=150&background=4DD4ED&color=0A2640',
    'https://ui-avatars.com/api/?name=Frank+Liu&size=150&background=18c9e8&color=fff',
    'https://ui-avatars.com/api/?name=Dev+Test&size=150&background=FF5722&color=fff',
  ]
  await db.query(
    `INSERT INTO users (id, email, password_hash, display_name, age, agreed_to_terms, avatar_url)
     VALUES 
       ($1, 'alice@test.com', $2, 'Alice Chen', 28, true, $8),
       ($3, 'bob@test.com', $2, 'Bob Wong', 35, true, $9),
       ($4, 'carol@test.com', $2, 'Carol Lee', 24, true, $10),
       ($5, 'dave@test.com', $2, 'Dave Lam', 42, true, $11),
       ($6, 'eva@test.com', $2, 'Eva Tang', 31, true, $12),
       ($7, 'frank@test.com', $2, 'Frank Liu', 26, true, $13),
       ($14, 'dev@test.com', $2, 'Dev Test', 25, true, $15)
     `,
    [USER_IDS.alice, passwordHash, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave, USER_IDS.eva, USER_IDS.frank, ...avatarUrls.slice(0, 6), USER_IDS.dev, avatarUrls[6]]
  )
  console.log('✓ 7 users created (alice, bob, carol, dave, eva, frank, dev) - alice & dev have developer mode')

  // 1b. Add 100 mock users for demo/testing (password: Test1234!)
  const MOCK_NAMES = [
    '陳大明', '王美玲', '李志強', '張雅婷', '劉俊傑', '黃曉雯', '林志偉', '吳淑芬', '陳家豪', '楊雅惠',
    '周志明', '鄭美華', '孫建國', '馬麗娟', '朱志偉', '胡雅琪', '郭志豪', '何美玲', '高志強', '羅雅婷',
    '梁俊傑', '宋曉雯', '唐志偉', '韓淑芬', '馮家豪', '于雅惠', '董志明', '蕭美華', '曹建國', '袁麗娟',
    '鄧志偉', '彭雅琪', '呂志豪', '蘇美玲', '盧志強', '蔣雅婷', '蔡俊傑', '賈曉雯', '丁志偉', '魏淑芬',
    '薛家豪', '葉雅惠', '閻志明', '潘美華', '戴建國', '鍾麗娟', '汪志偉', '田雅琪', '任志豪', '杜美玲',
    'Amy Wong', 'Ben Chan', 'Cindy Lee', 'David Ng', 'Emma Cheung', 'Frank Ho', 'Grace Lau', 'Henry Tsang',
    'Ivy Mok', 'Jack Tam', 'Kelly Yip', 'Leo Fong', 'Mary Ko', 'Nick Hui', 'Olivia Au', 'Peter Lam',
    'Queenie Cheung', 'Raymond Wong', 'Sandy Chan', 'Tony Lee', 'Una Ng', 'Victor Ho', 'Wendy Lau',
    'Xavier Tsang', 'Yuki Mok', 'Zoe Tam', 'Alex Yip', 'Betty Fong', 'Chris Ko', 'Diana Hui', 'Eric Au',
    'Fiona Lam', 'George Cheung', 'Helen Wong', 'Ivan Chan', 'Joyce Lee', 'Kevin Ng', 'Lisa Ho',
    'Mike Lau', 'Nancy Tsang', 'Oscar Mok', 'Pauline Tam', 'Quincy Yip', 'Rita Fong', 'Steve Ko',
  ]
  const avatarColors = ['00B8D4', '0097A7', '6EE0FF', 'FFD34E', '4DD4ED', '18c9e8', 'FF5722', '7B1FA2', '388E3C', 'F57C00']
  for (let i = 0; i < 100; i++) {
    const name = MOCK_NAMES[i % MOCK_NAMES.length]
    const displayName = i < MOCK_NAMES.length ? name : `${name} ${i + 1}`
    const email = `mock${i + 1}@test.com`
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=${avatarColors[i % avatarColors.length]}&color=fff`
    const age = 18 + (i % 48) // 18-65
    await db.query(
      `INSERT INTO users (email, password_hash, display_name, age, agreed_to_terms, avatar_url)
       VALUES ($1, $2, $3, $4, true, $5)`,
      [email, passwordHash, displayName, age, avatarUrl]
    )
  }
  console.log('✓ 100 mock users created (mock1@test.com ... mock100@test.com, password: Test1234!)')

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

  // 2b. Add 100 more activities (mix of upcoming, completed, cancelled)
  const mockUsersResult = await db.query(
    `SELECT id FROM users WHERE email LIKE 'mock%@test.com' ORDER BY email`
  )
  const mockUserIds = mockUsersResult.rows.map((r: { id: string }) => r.id)
  const allCreatorIds = [
    USER_IDS.alice, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave,
    USER_IDS.eva, USER_IDS.frank, ...mockUserIds,
  ]

  const EXTRA_ACTIVITY_TEMPLATES = [
    { title: 'Lung Fu Shan Morning Run', desc: '5K hill run with city views', lat: 22.2815, lng: 114.1382, addr: 'Lung Fu Shan, Mid-Levels', dist: 5, max: 8 },
    { title: 'Aberdeen Reservoir Trail', desc: '8K scenic reservoir loop', lat: 22.2567, lng: 114.1456, addr: 'Aberdeen Reservoir', dist: 8, max: 10 },
    { title: 'Pok Fu Lam Country Park', desc: '6K trail run', lat: 22.2612, lng: 114.1323, addr: 'Pok Fu Lam', dist: 6, max: 6 },
    { title: 'Cyberport Waterfront', desc: '4K flat waterfront run', lat: 22.2618, lng: 114.1298, addr: 'Cyberport', dist: 4, max: 12 },
    { title: 'Lamma Island Coastal', desc: '10K island trail', lat: 22.2105, lng: 114.1123, addr: 'Lamma Island', dist: 10, max: 15 },
    { title: 'Cheung Chau Beach Run', desc: '7K beach and village', lat: 22.2067, lng: 114.0289, addr: 'Cheung Chau', dist: 7, max: 10 },
    { title: 'Tuen Mun Riverside', desc: '9K riverside path', lat: 22.3923, lng: 113.9767, addr: 'Tuen Mun', dist: 9, max: 12 },
    { title: 'Yuen Long Park Loop', desc: '5K park run', lat: 22.4456, lng: 114.0312, addr: 'Yuen Long', dist: 5, max: 8 },
    { title: 'Tai Po Waterfront', desc: '8K harbour run', lat: 22.4523, lng: 114.1678, addr: 'Tai Po', dist: 8, max: 10 },
    { title: 'Ma On Shan Trail', desc: '12K mountain trail', lat: 22.4234, lng: 114.2345, addr: 'Ma On Shan', dist: 12, max: 8 },
    { title: 'Clear Water Bay Run', desc: '6K coastal path', lat: 22.2678, lng: 114.2891, addr: 'Clear Water Bay', dist: 6, max: 10 },
    { title: 'Sai Kung Town Run', desc: '5K town and pier', lat: 22.3812, lng: 114.2712, addr: 'Sai Kung', dist: 5, max: 12 },
    { title: 'Kwun Tong Promenade', desc: '4K harbour run', lat: 22.3123, lng: 114.2234, addr: 'Kwun Tong', dist: 4, max: 15 },
    { title: 'Mong Kok Night Run', desc: '3K urban run', lat: 22.3198, lng: 114.1698, addr: 'Mong Kok', dist: 3, max: 20 },
    { title: 'Wong Tai Sin Temple Run', desc: '5K temple area', lat: 22.3423, lng: 114.2067, addr: 'Wong Tai Sin', dist: 5, max: 8 },
    { title: 'Diamond Hill Run', desc: '6K park and hill', lat: 22.3456, lng: 114.2012, addr: 'Diamond Hill', dist: 6, max: 10 },
    { title: 'Lok Fu Park Jog', desc: '4K easy jog', lat: 22.3345, lng: 114.1876, addr: 'Lok Fu', dist: 4, max: 12 },
    { title: 'Kowloon City Run', desc: '5K neighbourhood', lat: 22.3289, lng: 114.1923, addr: 'Kowloon City', dist: 5, max: 8 },
    { title: 'Hung Hom Promenade', desc: '6K harbour views', lat: 22.3045, lng: 114.1789, addr: 'Hung Hom', dist: 6, max: 10 },
  ]

  const extraActivities: { id: string; creator_id: string; status: string }[] = []
  for (let i = 0; i < 100; i++) {
    const tpl = EXTRA_ACTIVITY_TEMPLATES[i % EXTRA_ACTIVITY_TEMPLATES.length]
    const creatorId = allCreatorIds[i % allCreatorIds.length]
    const statusRoll = i % 10
    const status = statusRoll < 4 ? 'upcoming' : statusRoll < 9 ? 'completed' : 'cancelled'
    let scheduledDate: Date
    if (status === 'upcoming') {
      const d = new Date(now)
      d.setDate(d.getDate() + (i % 30) + 1)
      d.setHours(9 + (i % 3), 0, 0, 0)
      scheduledDate = d
    } else if (status === 'completed') {
      const d = new Date(now)
      d.setDate(d.getDate() - (i % 21) - 1)
      d.setHours(7 + (i % 2), 0, 0, 0)
      scheduledDate = d
    } else {
      scheduledDate = new Date(now.getTime() - (i + 1) * 86400000)
    }
    const result = await db.query(
      `INSERT INTO activities (creator_id, title, description, scheduled_date, latitude, longitude, address, route, distance, max_participants, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10)
       RETURNING id, creator_id, status`,
      [creatorId, `${tpl.title} ${i > 19 ? (Math.floor(i / 20) + 1) : ''}`.trim(), tpl.desc, scheduledDate, tpl.lat, tpl.lng, tpl.addr, tpl.dist, tpl.max, status]
    )
    extraActivities.push(result.rows[0])
  }
  console.log('✓ 100 extra activities created (40 upcoming, 55 completed, 5 cancelled)')

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
  // Add participants for extra activities (completed ones: 2-4 participants each)
  const completedExtra = extraActivities.filter((a) => a.status === 'completed')
  const allUserIds = [USER_IDS.alice, USER_IDS.bob, USER_IDS.carol, USER_IDS.dave, USER_IDS.eva, USER_IDS.frank, ...mockUserIds]
  for (const act of completedExtra) {
    const numParticipants = 2 + (act.id.charCodeAt(0) % 3)
    for (let p = 0; p < numParticipants; p++) {
      const userId = allUserIds[(act.id.charCodeAt(0) + p * 7) % allUserIds.length]
      await db.query(
        'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT (activity_id, user_id) DO NOTHING',
        [act.id, userId]
      )
    }
  }
  // Add some participants to upcoming extra activities
  const upcomingExtra = extraActivities.filter((a) => a.status === 'upcoming')
  for (let i = 0; i < Math.min(30, upcomingExtra.length); i++) {
    const act = upcomingExtra[i]
    const numParticipants = 1 + (i % 3)
    for (let p = 0; p < numParticipants; p++) {
      const userId = allUserIds[(i * 11 + p) % allUserIds.length]
      await db.query(
        'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2) ON CONFLICT (activity_id, user_id) DO NOTHING',
        [act.id, userId]
      )
    }
  }
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
       ($1, 'new_follower', '新追蹤者', 'Frank Liu 開始追蹤你', $11, false),
       ($3, 'activity_joined', '加入成功', '你已成功加入 Evening Run - Kowloon Park', $4, true),
       ($3, 'new_follower', '新追蹤者', 'Alice Chen 開始追蹤你', $1, false),
       ($3, 'chat_message', '新訊息', 'Bob Wong 在 Evening Run 活動中發送了訊息', $4, false),
       ($5, 'activity_reminder', '活動提醒', 'Central Harbour Run 即將開始', $6, true),
       ($5, 'chat_message', '新訊息', 'Alice Chen 在 Central Harbour Run 活動中發送了訊息', $6, true),
       ($7, 'activity_reminder', '活動提醒', 'Sunrise Run - West Kowloon 將於三天後舉行', $8, false),
       ($9, 'new_follower', '新追蹤者', 'Bob Wong 開始追蹤你', $5, false),
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

  // 8b. Add routes for leaderboard (start_time in current week & month)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const distances = [3, 4, 5, 5.5, 6, 7, 8, 9, 10, 12, 15, 21]
  let routeCount = 0
  for (const act of completedExtra) {
    const participantsResult = await db.query(
      'SELECT user_id FROM activity_participants WHERE activity_id = $1',
      [act.id]
    )
    const dayOffset = routeCount % Math.max(1, now.getDay() + 1)
    const dist = distances[routeCount % distances.length]
    const duration = Math.round((dist / 10) * 3600)
    const startTime = new Date(weekStart)
    startTime.setDate(weekStart.getDate() + dayOffset)
    startTime.setHours(7 + (routeCount % 3), 0, 0, 0)
    const endTime = new Date(startTime.getTime() + duration * 1000)
    for (const row of participantsResult.rows) {
      const speed = 8 + (routeCount % 3)
      await db.query(
        `INSERT INTO routes (activity_id, user_id, total_distance, average_speed, duration, start_time, end_time, positions_s3_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
        [act.id, row.user_id, dist, speed, duration, startTime, endTime]
      )
      routeCount++
    }
  }
  console.log(`✓ Route records created (7 original + ${routeCount} for leaderboard, no GPS track for local testing)`)

  // 9. Run Memory Cards (Lenticular-style post-run summary)
  // 1-3 cards per activity, generated right after run date, topic relevant to route/view
  console.log('Creating run memory cards...')
  const runDate1 = lastWeek.toISOString().slice(0, 10)
  const runDate2 = completed2Start.toISOString().slice(0, 10)
  const runDate3 = completed3Start.toISOString().slice(0, 10)

  const cardsToInsert = [
    // Central Harbour Run - 2 cards, harbour view theme
    {
      activityId: completed1.id,
      createdBy: USER_IDS.alice,
      runDate: runDate1,
      metrics: { dist: 7.2, speed: 9.6, dur: 2700, participants: 2 },
      weather: { temp: 24, desc: 'Clear skies' },
      headline: '維港晨跑 · 海港風光盡收眼底',
      messages: [
        { userId: USER_IDS.alice, displayName: 'Alice Chen', content: '維港景色太美了！下次再約！' },
        { userId: USER_IDS.bob, displayName: 'Bob Wong', content: '謝謝大家，一起跑真好' },
      ],
      seed: 1,
    },
    {
      activityId: completed1.id,
      createdBy: USER_IDS.bob,
      runDate: runDate1,
      metrics: { dist: 6.8, speed: 9.1, dur: 2680, participants: 2 },
      weather: { temp: 24, desc: 'Clear skies' },
      headline: '中環海濱 · 跑步路線推薦',
      messages: [
        { userId: USER_IDS.bob, displayName: 'Bob Wong', content: '海風吹著很舒服' },
      ],
      seed: 2,
    },
    // Tai Tam Reservoir Trail - 1 card, trail nature theme
    {
      activityId: completed2.id,
      createdBy: USER_IDS.carol,
      runDate: runDate2,
      metrics: { dist: 8.1, speed: 8.5, dur: 3600, participants: 2 },
      weather: { temp: 22, desc: 'Partly cloudy' },
      headline: '大潭水塘 · 山徑越野跑紀錄',
      messages: [
        { userId: USER_IDS.carol, displayName: 'Carol Lee', content: '第一次跑山徑，風景超棒！' },
        { userId: USER_IDS.dave, displayName: 'Dave Lam', content: '歡迎加入，下次再來' },
      ],
      seed: 3,
    },
    // Sha Tin Riverside Run - 2 cards, riverside theme
    {
      activityId: completed3.id,
      createdBy: USER_IDS.eva,
      runDate: runDate3,
      metrics: { dist: 10.2, speed: 9.2, dur: 3960, participants: 3 },
      weather: { temp: 26, desc: 'Sunny' },
      headline: '城門河畔 · 十公里平路跑',
      messages: [
        { userId: USER_IDS.eva, displayName: 'Eva Tang', content: '河畔跑風景好，天氣完美' },
        { userId: USER_IDS.frank, displayName: 'Frank Liu', content: '今天 PB 了！' },
      ],
      seed: 4,
    },
    {
      activityId: completed3.id,
      createdBy: USER_IDS.frank,
      runDate: runDate3,
      metrics: { dist: 9.8, speed: 8.9, dur: 3980, participants: 3 },
      weather: { temp: 26, desc: 'Sunny' },
      headline: '沙田城門河 · 沿河跑步路線',
      messages: [
        { userId: USER_IDS.frank, displayName: 'Frank Liu', content: '謝謝大家鼓勵' },
      ],
      seed: 5,
    },
  ]

  for (let i = 0; i < cardsToInsert.length; i++) {
    const c = cardsToInsert[i]
    await db.query(
      `INSERT INTO run_memory_cards (
        activity_id, route_id, created_by, run_date, participant_count,
        total_distance, average_speed, duration_seconds, weather_temp, weather_desc,
        news_headline, ai_image_url, group_photo_url, messages, route_summary
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb)`,
      [
        c.activityId,
        c.createdBy,
        c.runDate,
        c.metrics.participants,
        c.metrics.dist,
        c.metrics.speed,
        c.metrics.dur,
        c.weather.temp,
        c.weather.desc,
        c.headline,
        `https://picsum.photos/seed/run${c.seed}/400/300`,
        `https://picsum.photos/seed/group${c.seed}/400/300`,
        JSON.stringify(c.messages),
        JSON.stringify({ pointCount: 60 + i * 5, pathPreview: [[22.28, 114.15], [22.29, 114.16], [22.30, 114.17]] }),
      ]
    )
  }
  console.log(`✓ ${cardsToInsert.length} run memory cards created (1-3 per activity)`)

  const cardsResult = await db.query(
    `SELECT id FROM run_memory_cards ORDER BY created_at DESC LIMIT ${cardsToInsert.length}`
  )
  const cardIds = cardsResult.rows.map((r: { id: string }) => r.id)
  console.log('  Memory card IDs (for testing):', cardIds.join(', '))

  console.log('')
  console.log('✅ Seed completed!')
  console.log('')
  console.log('See SEED_TESTING_GUIDE.md for login credentials and testing instructions.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
