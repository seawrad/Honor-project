import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config()

// Configure AWS SDK
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}

// Create S3 client
const s3 = new AWS.S3(s3Config)

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'group-running-routes'

export class S3Service {
  /**
   * Upload GPS positions to S3
   */
  static async uploadPositions(routeId: string, positions: any[]): Promise<string> {
    const key = `routes/${routeId}/positions.json`
    
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(positions),
        ContentType: 'application/json',
      }

      await s3.putObject(params).promise()
      return key
    } catch (error) {
      console.error('Failed to upload positions to S3:', error)
      throw new Error('Failed to upload GPS positions')
    }
  }

  /**
   * Retrieve GPS positions from S3
   */
  static async getPositions(s3Key: string): Promise<any[]> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
      }

      const result = await s3.getObject(params).promise()
      
      if (!result.Body) {
        throw new Error('No data found in S3')
      }

      return JSON.parse(result.Body.toString('utf-8'))
    } catch (error) {
      console.error('Failed to retrieve positions from S3:', error)
      throw new Error('Failed to retrieve GPS positions')
    }
  }

  /**
   * Delete GPS positions from S3
   */
  static async deletePositions(s3Key: string): Promise<void> {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
      }

      await s3.deleteObject(params).promise()
    } catch (error) {
      console.error('Failed to delete positions from S3:', error)
      throw new Error('Failed to delete GPS positions')
    }
  }
}
