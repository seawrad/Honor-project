import { Pool, PoolClient, QueryResult } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'group_running_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  options: process.env.DB_TIMEZONE ? `-c timezone=${process.env.DB_TIMEZONE}` : '-c timezone=Asia/Hong_Kong',
}

// Create connection pool
const pool = new Pool(dbConfig)

// Pool error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Database client wrapper with error handling
export class DatabaseClient {
  private pool: Pool

  constructor(connectionPool: Pool) {
    this.pool = connectionPool
  }

  /**
   * Execute a query with automatic error handling
   */
  async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now()
    try {
      const result = await this.pool.query<T>(text, params)
      const duration = Date.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount })
      }
      
      return result
    } catch (error) {
      console.error('Database query error:', {
        text,
        params,
        error: error instanceof Error ? error.message : error,
      })
      throw new DatabaseError('Query execution failed', error as Error)
    }
  }

  /**
   * Get a client from the pool for transactions
   */
  async getClient(): Promise<PoolClient> {
    try {
      const client = await this.pool.connect()
      return client
    } catch (error) {
      console.error('Failed to get database client:', error)
      throw new DatabaseError('Failed to acquire database connection', error as Error)
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Transaction failed, rolled back:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()')
      console.log('Database connection successful:', result.rows[0])
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    try {
      await this.pool.end()
      console.log('Database pool closed')
    } catch (error) {
      console.error('Error closing database pool:', error)
      throw error
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    }
  }
}

// Custom database error class
export class DatabaseError extends Error {
  public originalError?: Error

  constructor(message: string, originalError?: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.originalError = originalError
    
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

// Export singleton instance
export const db = new DatabaseClient(pool)

// Export pool for direct access if needed
export { pool }
