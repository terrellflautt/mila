# 🚀 Deployment Guide for Mila's World

This guide will walk you through deploying Mila's World to AWS.

---

## Prerequisites Checklist

- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured
- [ ] Node.js 18+ installed
- [ ] Domain registered (terrellflautt.com)
- [ ] Web3Forms account and API key

---

## Step 1: Prepare Your Environment

### Install Dependencies

```bash
cd milas-world
npm install
```

### Test Locally

```bash
npm run dev
```

Visit `http://localhost:5173` and test:
- Security gate (answer: "flamingo" or "flamingos")
- Wrong answer triggers troll mode
- Stage animations load correctly

---

## Step 2: Set Up Route 53 (If Not Already Done)

### Create Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name terrellflautt.com \
  --caller-reference $(date +%s)
```

**Important**: Update your domain registrar's nameservers to point to the AWS Route 53 nameservers.

---

## Step 3: Deploy Infrastructure

### Option A: Automated Deployment (Recommended)

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Build frontend
2. Package Lambda
3. Deploy CloudFormation
4. Upload to S3
5. Invalidate cache

### Option B: Manual Deployment

#### Deploy CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation-template.yaml \
  --stack-name MilasWorld \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    DomainName=mila.terrellflautt.com \
    Web3FormsAccessKey=YOUR_KEY \
    EmailTo=birthmybuild@gmail.com
```

#### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name MilasWorld \
  --query 'Stacks[0].Outputs'
```

Save these values:
- `WebsiteBucketName`
- `CloudFrontDistributionId`
- `CloudFrontDomainName`
- `ApiEndpoint`

---

## Step 4: Build and Upload Frontend

### Build

```bash
npm run build
```

### Upload to S3

```bash
aws s3 sync dist/ s3://mila.terrellflautt.com --delete
```

---

## Step 5: Deploy Lambda Function

### Package Lambda

```bash
cd lambda
npm install
zip -r ../infrastructure/function.zip .
cd ..
```

### Update Lambda Code

```bash
aws lambda update-function-code \
  --function-name MilasWorld-AnswerHandler \
  --zip-file fileb://infrastructure/function.zip
```

### Verify Lambda

```bash
aws lambda get-function --function-name MilasWorld-AnswerHandler
```

---

## Step 6: Configure DNS

### Get CloudFront Domain

```bash
aws cloudformation describe-stacks \
  --stack-name MilasWorld \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text
```

### Create Route 53 Record

Get your hosted zone ID:
```bash
aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='terrellflautt.com.'].Id" \
  --output text
```

Create record set JSON (`record-set.json`):
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "mila.terrellflautt.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "YOUR_CLOUDFRONT_DOMAIN.cloudfront.net"
      }]
    }
  }]
}
```

Apply:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://record-set.json
```

---

## Step 7: SSL Certificate (HTTPS)

### Request Certificate in ACM

**Important**: Certificate MUST be in `us-east-1` for CloudFront.

```bash
aws acm request-certificate \
  --domain-name mila.terrellflautt.com \
  --validation-method DNS \
  --region us-east-1
```

### Get Validation Records

```bash
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1
```

### Add Validation Records to Route 53

The output will show CNAME records to add. Add them to Route 53.

### Update CloudFormation Template

Edit `infrastructure/cloudformation-template.yaml`:

```yaml
ViewerCertificate:
  AcmCertificateArn: arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID
  SslSupportMethod: sni-only
  MinimumProtocolVersion: TLSv1.2_2021
```

Redeploy:
```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation-template.yaml \
  --stack-name MilasWorld \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    DomainName=mila.terrellflautt.com
```

---

## Step 8: Test Everything

### Test Security Gate
1. Visit `https://mila.terrellflautt.com`
2. Enter "flamingo" → Should enter successfully
3. Try wrong answer twice → Should redirect to Google

### Test API
```bash
curl -X POST https://YOUR_API_ENDPOINT/prod/answer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "questionId": "q1",
    "questionText": "Test question",
    "answerValue": "Test answer"
  }'
```

### Check Email
- Submit an answer through the site
- Check `birthmybuild@gmail.com` for notification

### Check DynamoDB
```bash
aws dynamodb scan --table-name MilasWorld-Answers
```

---

## Step 9: Monitoring & Logs

### CloudWatch Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/MilasWorld-AnswerHandler --follow

# API Gateway logs (if enabled)
aws logs tail /aws/apigateway/MilasWorld-API --follow
```

### CloudFront Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=YOUR_DISTRIBUTION_ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Troubleshooting

### Issue: CloudFront shows old content

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Issue: Lambda function errors

```bash
# Check logs
aws logs tail /aws/lambda/MilasWorld-AnswerHandler --follow

# Test directly
aws lambda invoke \
  --function-name MilasWorld-AnswerHandler \
  --payload '{"httpMethod":"OPTIONS"}' \
  response.json
```

### Issue: CORS errors

Check API Gateway CORS configuration:
- OPTIONS method exists
- Proper headers in Lambda response
- `Access-Control-Allow-Origin: *` in headers

### Issue: SSL not working

1. Verify certificate is in `us-east-1`
2. Verify certificate is validated
3. Verify CloudFormation has correct ACM ARN
4. Wait up to 30 minutes for CloudFront to deploy changes

---

## Updating the Site

### Frontend Changes

```bash
npm run build
aws s3 sync dist/ s3://mila.terrellflautt.com --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Lambda Changes

```bash
cd lambda
npm install
zip -r ../infrastructure/function.zip .
cd ..

aws lambda update-function-code \
  --function-name MilasWorld-AnswerHandler \
  --zip-file fileb://infrastructure/function.zip
```

### Content Changes

Edit files in `content/` directory, then rebuild and redeploy frontend.

---

## Cost Estimates

**Monthly costs** (estimated):
- S3 Storage: ~$0.023/GB (~$0.50 for small site)
- CloudFront: ~$0.085/GB transfer (~$2-5 depending on traffic)
- DynamoDB: On-demand, ~$0.25/million writes (~$0.10)
- Lambda: First 1M requests free (~$0)
- Route 53: $0.50/hosted zone
- API Gateway: $1/million requests (~$0.10)

**Total**: ~$3-7/month for low to moderate traffic

---

## Security Checklist

- [ ] IAM roles use least privilege
- [ ] DynamoDB encryption enabled (KMS)
- [ ] S3 bucket not publicly writable
- [ ] API Gateway rate limiting enabled
- [ ] CloudFront HTTPS only
- [ ] Lambda environment variables not exposed
- [ ] Web3Forms key stored as parameter

---

## Backup & Recovery

### Backup DynamoDB

Enable Point-in-Time Recovery (already enabled in template):
```bash
aws dynamodb update-continuous-backups \
  --table-name MilasWorld-Answers \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Backup S3

Enable versioning (optional):
```bash
aws s3api put-bucket-versioning \
  --bucket mila.terrellflautt.com \
  --versioning-configuration Status=Enabled
```

---

## Final Checklist

- [ ] Domain DNS pointing to CloudFront
- [ ] SSL certificate valid and applied
- [ ] Security gate works
- [ ] Puzzles load and complete
- [ ] Answers save to DynamoDB
- [ ] Email notifications arrive
- [ ] Mobile responsive
- [ ] Load time < 2s
- [ ] No console errors

---

## 🎉 You're Live!

Once everything is deployed and tested:

1. Visit `https://mila.terrellflautt.com`
2. Test the complete flow
3. Share the link with Mila ❤️

**Remember**: This is a love letter in code. Every detail matters.

---

Questions? Check CloudWatch logs first, then review the main README.md for architecture details.
