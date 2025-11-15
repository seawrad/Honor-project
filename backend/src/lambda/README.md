# AWS Lambda Functions

This directory contains AWS Lambda functions for scheduled tasks.

## Activity Reminders Lambda

### Purpose
Sends reminder notifications to activity participants before activities start.

### Function Details
- **File**: `activity-reminders.ts`
- **Runtime**: Node.js 18.x or later
- **Handler**: `activity-reminders.handler`

### Environment Variables
The Lambda function requires the following environment variables:

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=group_running_app
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true
```

### Scheduling

#### 1-Hour Reminders
- **Schedule**: Every hour
- **CloudWatch Events Rule**: `rate(1 hour)` or `cron(0 * * * ? *)`
- **Event Payload**:
```json
{
  "reminderType": "1hour"
}
```

#### 24-Hour Reminders
- **Schedule**: Once daily (recommended at noon UTC)
- **CloudWatch Events Rule**: `rate(1 day)` or `cron(0 12 * * ? *)`
- **Event Payload**:
```json
{
  "reminderType": "24hour"
}
```

### Deployment Steps

#### 1. Build the Lambda Function

```bash
cd backend
npm run build
```

#### 2. Create Deployment Package

```bash
# Create a deployment directory
mkdir -p lambda-deploy
cd lambda-deploy

# Copy the compiled Lambda function
cp ../dist/lambda/activity-reminders.js index.js

# Copy node_modules (only production dependencies)
cp -r ../node_modules .

# Create ZIP file
zip -r activity-reminders.zip index.js node_modules/
```

#### 3. Create Lambda Function via AWS CLI

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name activity-reminders \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://activity-reminders.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment Variables="{DB_HOST=your-rds-endpoint,DB_PORT=5432,DB_NAME=group_running_app,DB_USER=your-user,DB_PASSWORD=your-password,DB_SSL=true}"
```

#### 4. Create CloudWatch Events Rules

**1-Hour Reminder Rule:**
```bash
# Create the rule
aws events put-rule \
  --name activity-1hour-reminders \
  --schedule-expression "rate(1 hour)"

# Add Lambda permission
aws lambda add-permission \
  --function-name activity-reminders \
  --statement-id activity-1hour-reminders \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:REGION:ACCOUNT_ID:rule/activity-1hour-reminders

# Add target
aws events put-targets \
  --rule activity-1hour-reminders \
  --targets "Id"="1","Arn"="arn:aws:lambda:REGION:ACCOUNT_ID:function:activity-reminders","Input"='{"reminderType":"1hour"}'
```

**24-Hour Reminder Rule:**
```bash
# Create the rule (runs daily at noon UTC)
aws events put-rule \
  --name activity-24hour-reminders \
  --schedule-expression "cron(0 12 * * ? *)"

# Add Lambda permission
aws lambda add-permission \
  --function-name activity-reminders \
  --statement-id activity-24hour-reminders \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:REGION:ACCOUNT_ID:rule/activity-24hour-reminders

# Add target
aws events put-targets \
  --rule activity-24hour-reminders \
  --targets "Id"="1","Arn"="arn:aws:lambda:REGION:ACCOUNT_ID:function:activity-reminders","Input"='{"reminderType":"24hour"}'
```

### IAM Role Requirements

The Lambda execution role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
    }
  ]
}
```

### VPC Configuration

If your RDS database is in a VPC, configure the Lambda function to run in the same VPC:

```bash
aws lambda update-function-configuration \
  --function-name activity-reminders \
  --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxx
```

### Local Testing

To test the Lambda function locally:

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=group_running_app
export DB_USER=postgres
export DB_PASSWORD=password
export DB_SSL=false

# Run the function
tsx src/lambda/activity-reminders.ts
```

### Monitoring

Monitor Lambda execution in CloudWatch Logs:
- Log Group: `/aws/lambda/activity-reminders`
- Check for errors and notification counts

### Troubleshooting

**Connection Timeout:**
- Ensure Lambda is in the same VPC as RDS
- Check security group rules allow Lambda to connect to RDS
- Verify RDS endpoint and credentials

**No Notifications Sent:**
- Check if there are activities scheduled in the time window
- Verify the query logic matches your timezone requirements
- Check CloudWatch Logs for query results

**High Execution Time:**
- Consider batching notification inserts
- Optimize database queries with proper indexes
- Increase Lambda memory if needed
