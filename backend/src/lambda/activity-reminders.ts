/**
 * AWS Lambda function for sending activity reminders
 * 
 * This function should be scheduled to run:
 * - Every hour to check for 1-hour reminders
 * - Once daily to check for 24-hour reminders
 * 
 * CloudWatch Events configuration:
 * - 1-hour reminders: rate(1 hour) or cron(0 * * * ? *)
 * - 24-hour reminders: rate(1 day) or cron(0 12 * * ? *)
 */

import { Handler } from 'aws-lambda'
import { Pool } from 'pg'

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

interface LambdaEvent {
  reminderType: '1hour' | '24hour'
}

interface LambdaResponse {
  statusCode: number
  body: string
}

/**
 * Send activity reminder notifications
 */
async function sendActivityReminders(hoursBeforeStart: number): Promise<number> {
  const client = await pool.connect()

  try {
    // Find activities starting in the specified hours
    const query = `
      SELECT 
        a.id,
        a.title,
        a.scheduled_date,
        array_agg(ap.user_id) as participant_ids
      FROM activities a
      INNER JOIN activity_participants ap ON a.id = ap.activity_id
      WHERE 
        a.status = 'upcoming'
        AND a.scheduled_date > NOW()
        AND a.scheduled_date <= NOW() + INTERVAL '${hoursBeforeStart} hours'
        AND a.scheduled_date > NOW() + INTERVAL '${hoursBeforeStart - 1} hours'
      GROUP BY a.id, a.title, a.scheduled_date
    `

    const result = await client.query(query)
    const activities = result.rows

    let notificationCount = 0

    for (const activity of activities) {
      const participantIds = activity.participant_ids as string[]
      const title = hoursBeforeStart === 24 ? 'Activity Tomorrow' : 'Activity Starting Soon'
      const message = hoursBeforeStart === 24 
        ? `Reminder: "${activity.title}" starts tomorrow`
        : `Reminder: "${activity.title}" starts in 1 hour`

      // Create notifications for each participant
      for (const userId of participantIds) {
        const insertQuery = `
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES ($1, $2, $3, $4, $5)
        `

        await client.query(insertQuery, [
          userId,
          'activity_reminder',
          title,
          message,
          activity.id,
        ])

        notificationCount++
      }
    }

    console.log(`Sent ${notificationCount} ${hoursBeforeStart}-hour reminders for ${activities.length} activities`)
    return notificationCount
  } finally {
    client.release()
  }
}

/**
 * Lambda handler function
 */
export const handler: Handler<LambdaEvent, LambdaResponse> = async (event) => {
  try {
    console.log('Activity reminder Lambda triggered', event)

    const reminderType = event.reminderType || '1hour'
    const hoursBeforeStart = reminderType === '24hour' ? 24 : 1

    const notificationCount = await sendActivityReminders(hoursBeforeStart)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Sent ${notificationCount} ${reminderType} reminders`,
        notificationCount,
      }),
    }
  } catch (error) {
    console.error('Error sending activity reminders:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

// For local testing
if (require.main === module) {
  (async () => {
    console.log('Running activity reminders locally...')
    
    // Test 1-hour reminders
    const result1h = await handler({ reminderType: '1hour' } as any, {} as any, {} as any)
    console.log('1-hour reminders result:', result1h)

    // Test 24-hour reminders
    const result24h = await handler({ reminderType: '24hour' } as any, {} as any, {} as any)
    console.log('24-hour reminders result:', result24h)

    await pool.end()
  })()
}
