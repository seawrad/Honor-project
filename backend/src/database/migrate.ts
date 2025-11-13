import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Migration tracking table
const MIGRATIONS_TABLE = 'schema_migrations'

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  await db.query(query)
  console.log('Migrations table ready')
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  try {
    const result = await db.query<{ name: string }>(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
    )
    return result.rows.map(row => row.name)
  } catch (error) {
    console.error('Error fetching executed migrations:', error)
    return []
  }
}



/**
 * Get list of migration files
 */
function getMigrationFiles(): string[] {
  const migrationsDir = join(__dirname, 'migrations')
  try {
    const files = readdirSync(migrationsDir)
    return files
      .filter(file => file.endsWith('.sql'))
      .sort()
  } catch (error) {
    console.error('Error reading migrations directory:', error)
    return []
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(filename: string): Promise<void> {
  const migrationsDir = join(__dirname, 'migrations')
  const filepath = join(migrationsDir, filename)
  
  console.log(`Executing migration: ${filename}`)
  
  try {
    const sql = readFileSync(filepath, 'utf-8')
    
    // Execute migration in a transaction
    await db.transaction(async (client) => {
      await client.query(sql)
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
        [filename]
      )
    })
    
    console.log(`✓ Migration completed: ${filename}`)
  } catch (error) {
    console.error(`✗ Migration failed: ${filename}`)
    throw error
  }
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...')
  
  try {
    // Test database connection
    const isConnected = await db.testConnection()
    if (!isConnected) {
      throw new Error('Database connection failed')
    }
    
    // Create migrations tracking table
    await createMigrationsTable()
    
    // Get executed and available migrations
    const executedMigrations = await getExecutedMigrations()
    const migrationFiles = getMigrationFiles()
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      return
    }
    
    console.log(`Found ${pendingMigrations.length} pending migration(s)`)
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration)
    }
    
    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Migration process failed:', error)
    throw error
  }
}

/**
 * Rollback last migration (for development)
 */
export async function rollbackLastMigration(): Promise<void> {
  console.log('Rolling back last migration...')
  
  try {
    const result = await db.query<{ name: string }>(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`
    )
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback')
      return
    }
    
    const lastMigration = result.rows[0].name
    console.log(`Rolling back: ${lastMigration}`)
    
    // Note: Automatic rollback requires down migrations
    // For now, just remove from tracking table
    await db.query(
      `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
      [lastMigration]
    )
    
    console.log('⚠ Migration removed from tracking. Manual database cleanup may be required.')
  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  
  if (command === 'up') {
    runMigrations()
      .then(() => {
        console.log('Migration process completed')
        process.exit(0)
      })
      .catch((error) => {
        console.error('Migration process failed:', error)
        process.exit(1)
      })
  } else if (command === 'rollback') {
    rollbackLastMigration()
      .then(() => {
        console.log('Rollback completed')
        process.exit(0)
      })
      .catch((error) => {
        console.error('Rollback failed:', error)
        process.exit(1)
      })
  } else {
    console.log('Usage: tsx migrate.ts [up|rollback]')
    process.exit(1)
  }
}
