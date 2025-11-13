import { db } from './db.js'

/**
 * Test database connection and display pool statistics
 */
async function testDatabaseConnection() {
  console.log('Testing database connection...')
  console.log('Configuration:')
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`)
  console.log(`  Port: ${process.env.DB_PORT || '5432'}`)
  console.log(`  Database: ${process.env.DB_NAME || 'group_running_app'}`)
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`)
  console.log()

  try {
    // Test connection
    const isConnected = await db.testConnection()
    
    if (isConnected) {
      console.log('✓ Database connection successful!')
      
      // Display pool statistics
      const stats = db.getPoolStats()
      console.log('\nConnection pool statistics:')
      console.log(`  Total connections: ${stats.total}`)
      console.log(`  Idle connections: ${stats.idle}`)
      console.log(`  Waiting requests: ${stats.waiting}`)
      
      // Test a simple query
      console.log('\nTesting query execution...')
      const result = await db.query('SELECT version()')
      console.log('✓ Query executed successfully!')
      console.log(`  PostgreSQL version: ${result.rows[0].version}`)
      
      process.exit(0)
    } else {
      console.error('✗ Database connection failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('✗ Error during connection test:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

testDatabaseConnection()
