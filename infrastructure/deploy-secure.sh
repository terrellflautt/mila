#!/bin/bash

# Mila's World - Secure Deployment Script
# Deploys to mila.terrellflautt.com with maximum security

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="milas-world-secure"
REGION="us-east-1"  # Must be us-east-1 for CloudFront certificate
DOMAIN_NAME="mila.terrellflautt.com"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Mila's World - Secure Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo ""

# Step 1: Build the frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd "$(dirname "$0")/.."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 2: Package Lambda functions
echo -e "${YELLOW}📦 Packaging Lambda functions...${NC}"
cd lambda

# Install dependencies for each Lambda function
for dir in answer-handler date-request-handler; do
    if [ -d "$dir" ]; then
        echo "  → Packaging $dir..."
        cd "$dir"
        npm install --production
        zip -r "../${dir}.zip" . > /dev/null
        cd ..
    fi
done

cd ..
echo -e "${GREEN}✅ Lambda functions packaged${NC}"
echo ""

# Step 3: Deploy CloudFormation stack
echo -e "${YELLOW}☁️  Deploying CloudFormation stack...${NC}"
echo -e "   Stack: ${STACK_NAME}"
echo -e "   Region: ${REGION}"
echo ""

aws cloudformation deploy \
    --template-file infrastructure/secure-cloudformation.yaml \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --parameter-overrides \
        DomainName="$DOMAIN_NAME" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed${NC}"
else
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"
    exit 1
fi
echo ""

# Step 4: Get stack outputs
echo -e "${YELLOW}📋 Retrieving stack outputs...${NC}"

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

SITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`SiteURL`].OutputValue' \
    --output text)

echo -e "   Bucket: ${GREEN}$BUCKET_NAME${NC}"
echo -e "   Distribution: ${GREEN}$DISTRIBUTION_ID${NC}"
echo -e "   API: ${GREEN}$API_ENDPOINT${NC}"
echo -e "   URL: ${GREEN}$SITE_URL${NC}"
echo ""

# Step 5: Update API endpoint in frontend config
echo -e "${YELLOW}🔧 Updating API endpoint in build...${NC}"

# Create a config.js file with the API endpoint
cat > dist/config.js << EOF
window.MILAS_WORLD_CONFIG = {
  API_ENDPOINT: '${API_ENDPOINT}'
};
EOF

echo -e "${GREEN}✅ API endpoint configured${NC}"
echo ""

# Step 6: Upload to S3
echo -e "${YELLOW}☁️  Uploading to S3...${NC}"

# Upload with correct content types and caching
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --region "$REGION" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "config.js"

# Upload HTML files with no-cache
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --region "$REGION" \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --exclude "*" \
    --include "*.html"

# Upload config.js with no-cache
aws s3 cp dist/config.js "s3://$BUCKET_NAME/config.js" \
    --region "$REGION" \
    --content-type "application/javascript" \
    --cache-control "no-cache, no-store, must-revalidate"

echo -e "${GREEN}✅ Files uploaded to S3${NC}"
echo ""

# Step 7: Invalidate CloudFront cache
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "   Invalidation ID: ${GREEN}$INVALIDATION_ID${NC}"
echo -e "${GREEN}✅ Cache invalidation created${NC}"
echo ""

# Step 8: Security summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  🔒 Security Configuration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "✅ S3 bucket is PRIVATE (no public access)"
echo -e "✅ CloudFront OAI enforced"
echo -e "✅ HTTPS only (HTTP→HTTPS redirect)"
echo -e "✅ DynamoDB encrypted at rest with KMS"
echo -e "✅ Lambda functions isolated with IAM roles"
echo -e "✅ Security gate protects all content"
echo -e "✅ Unauthorized users redirected to Google"
echo ""

# Step 9: DNS Configuration reminder
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  ⚠️  DNS Configuration Required${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "To make the site live at ${GREEN}$SITE_URL${NC}:"
echo ""
echo -e "1. Go to your domain registrar (e.g., GoDaddy, Namecheap)"
echo -e "2. Find DNS settings for terrellflautt.com"
echo -e "3. Add a CNAME record:"
echo -e "   Name: ${GREEN}mila${NC}"
echo -e "   Value: ${GREEN}$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)${NC}"
echo -e "   TTL: ${GREEN}300${NC}"
echo ""
echo -e "4. Wait 5-30 minutes for DNS propagation"
echo ""

# Final summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✨ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "🌐 CloudFront URL (works immediately):"
echo -e "   ${GREEN}https://$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)${NC}"
echo ""
echo -e "🌐 Custom Domain URL (after DNS setup):"
echo -e "   ${GREEN}$SITE_URL${NC}"
echo ""
echo -e "🔐 Password: ${YELLOW}flamingo${NC} (case-insensitive)"
echo ""
echo -e "📧 Answers will be sent to: ${GREEN}terrell.flautt@gmail.com${NC}"
echo ""
echo -e "${YELLOW}Note: The site is completely private. Without the flamingo password,${NC}"
echo -e "${YELLOW}unauthorized users will see the troll message and be sent to Google.${NC}"
echo ""

# Save deployment info
cat > deployment-info.txt << EOF
Mila's World - Deployment Information
Generated: $(date)

Stack Name: $STACK_NAME
Region: $REGION

S3 Bucket: $BUCKET_NAME
CloudFront Distribution: $DISTRIBUTION_ID
API Endpoint: $API_ENDPOINT

Site URL: $SITE_URL
CloudFront URL: https://$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

Security Password: flamingo (or flamingos)
Email: terrell.flautt@gmail.com

Status: PRIVATE - Only accessible with password
EOF

echo -e "${GREEN}Deployment info saved to: deployment-info.txt${NC}"
echo ""
