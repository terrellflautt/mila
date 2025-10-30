#!/bin/bash

# Mila's World Deployment Script
# This script deploys the complete infrastructure to AWS

set -e

echo "╔═══════════════════════════════════════╗"
echo "║   Deploying Mila's World to AWS     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Variables
STACK_NAME="MilasWorld"
REGION="us-east-1"
DOMAIN="mila.terrellflautt.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${BLUE}▸${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  print_error "AWS CLI is not installed. Please install it first."
  exit 1
fi

print_success "AWS CLI found"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  print_error "jq is not installed. Please install it for JSON parsing."
  exit 1
fi

print_success "jq found"

echo ""
print_status "Step 1: Building frontend..."
cd ..
npm install
npm run build
print_success "Frontend built successfully"

echo ""
print_status "Step 2: Building Lambda function..."
cd lambda
npm install
zip -r ../infrastructure/function.zip .
cd ../infrastructure
print_success "Lambda function packaged"

echo ""
print_status "Step 3: Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION \
  --parameter-overrides \
    DomainName=$DOMAIN \
    Web3FormsAccessKey=${WEB3FORMS_ACCESS_KEY:-"0da4e560-820a-4b81-8b85-91a90e019e01"} \
    EmailTo=${EMAIL_TO:-"birthmybuild@gmail.com"}

print_success "CloudFormation stack deployed"

echo ""
print_status "Step 4: Getting stack outputs..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text)

API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
  --output text)

print_success "Retrieved stack outputs"

echo ""
print_status "Step 5: Updating Lambda function code..."
aws lambda update-function-code \
  --function-name MilasWorld-AnswerHandler \
  --zip-file fileb://function.zip \
  --region $REGION > /dev/null

print_success "Lambda function code updated"

echo ""
print_status "Step 6: Uploading website to S3..."
cd ..
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $REGION
print_success "Website uploaded to S3"

echo ""
print_status "Step 7: Creating CloudFront invalidation..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" > /dev/null

print_success "CloudFront cache invalidated"

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║      Deployment Complete! ✨         ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📦 S3 Bucket: $BUCKET_NAME"
echo "🌐 CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "🔗 API Endpoint: $API_ENDPOINT"
echo "⚡ Lambda Function: MilasWorld-AnswerHandler"
echo ""
echo "Next steps:"
echo "1. Update your DNS to point $DOMAIN to $CLOUDFRONT_DOMAIN"
echo "2. Create an SSL certificate in ACM (us-east-1) for HTTPS"
echo "3. Update CloudFormation template with ACM certificate ARN"
echo ""
echo "The website is now live at: https://$CLOUDFRONT_DOMAIN"
echo ""
