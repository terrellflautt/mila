# Mila's World - Secure Deployment Guide

## 🔒 Security Architecture

This deployment is designed for **maximum privacy and security**:

### Security Features
- ✅ **Private S3 Bucket** - No public access, only CloudFront OAI can read
- ✅ **Flamingo Password Gate** - ONLY way to access the site
- ✅ **HTTPS Only** - All HTTP requests redirect to HTTPS
- ✅ **Encrypted Data** - DynamoDB with KMS encryption at rest
- ✅ **Isolated Lambda Functions** - IAM roles with minimal permissions
- ✅ **Troll Mode** - Unauthorized users get "POOF!" effect and redirected to Google
- ✅ **No Indexing** - Site appears invisible without the password
- ✅ **Serverless** - No predictable server patterns

### How Security Works

1. **Entry Point**: Users land on the Security Gate component
2. **Password Check**: Must enter "flamingo" or "flamingos" (case-insensitive)
3. **First Wrong Attempt**: Gentle hint message
4. **Second Wrong Attempt**:
   - Shows "WHO'S THAT TRIP TRAPPIN' OVER MY BRIDGE! BE GONE!" message
   - Magical POOF effect with particle explosion
   - Red screen flash
   - Redirect to Google.com
5. **Correct Answer**: Beautiful origami flamingo birds fly up, access granted

### Data Protection

- All answers stored in **encrypted DynamoDB** table
- Emails sent via Web3Forms (no server-side email handling)
- No logs contain sensitive data
- CloudFront access logs disabled
- API Gateway requires valid requests only

---

## 📦 Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with admin access
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```
3. **Domain**: terrellflautt.com with access to DNS settings
4. **Node.js** 18+ installed
5. **Git** (optional, for version control)

---

## 🚀 Deployment Steps

### Step 1: Prepare the Project

```bash
cd /mnt/c/Users/decry/Desktop/milas-world
npm install
npm run build
```

Verify the build creates a `dist/` directory with all assets.

### Step 2: Deploy to AWS

Run the secure deployment script:

```bash
./infrastructure/deploy-secure.sh
```

This script will:
1. ✅ Build the frontend
2. ✅ Package Lambda functions
3. ✅ Deploy CloudFormation stack
4. ✅ Upload files to private S3 bucket
5. ✅ Create CloudFront distribution
6. ✅ Set up API Gateway
7. ✅ Configure DynamoDB table
8. ✅ Invalidate CloudFront cache

**Expected time**: 5-10 minutes

### Step 3: Configure DNS

After deployment, you'll get a CloudFront domain name like:
```
d1234abcdef.cloudfront.net
```

To make the site live at `mila.terrellflautt.com`:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Navigate to DNS settings for `terrellflautt.com`
3. Add a **CNAME record**:
   - **Name**: `mila`
   - **Type**: `CNAME`
   - **Value**: `d1234abcdef.cloudfront.net` (your CloudFront domain)
   - **TTL**: `300` (5 minutes)

4. Save the DNS record
5. Wait 5-30 minutes for DNS propagation

### Step 4: Verify SSL Certificate

The CloudFormation template automatically requests an SSL certificate from AWS Certificate Manager. You may need to:

1. Check your email for a verification link from AWS
2. Click the link to verify domain ownership
3. Wait for certificate to be issued (usually <30 minutes)

Alternatively, if you have Route 53 managing your domain, the certificate will auto-validate via DNS.

### Step 5: Test the Deployment

**Immediate testing** (CloudFront URL):
```
https://d1234abcdef.cloudfront.net
```

**After DNS propagation**:
```
https://mila.terrellflautt.com
```

Test scenarios:
- ✅ Enter wrong password twice → should see POOF effect → redirect to Google
- ✅ Enter "flamingo" → should see flamingo birds → access granted
- ✅ Submit answers → should receive email at terrell.flautt@gmail.com
- ✅ Request date → should receive formatted email

---

## 🎨 What's Included

### Act I: The Awakening (Completed)
- **Security Gate** - Flamingo password entrance with origami birds
- **Puzzle 1**: The Curtain Rises - Draggable golden curtains
- **Puzzle 2**: The Echo Chamber - Audio rhythm matching (Simon Says)
- **Puzzle 3**: Reflections of You - Interactive water mirror

### Act II: The Becoming (Completed)
- **Puzzle 4**: The Choreographer - Particle trails with silhouette mirroring
- **Puzzle 5**: The Gallery of Us - GLSL shader frames that warm with attention
- **Puzzle 6**: The Dialogue - Poetic prompts affecting environment

### Act III: The Eternal (Blueprint Ready)
Based on the Act III blueprint, the structure includes:
- Scene 7: Constellation You - Interactive star field
- Scene 8: Mirror of Moments - Floating glass fragments that merge
- Scene 9: Eternal Garden - Generative light garden with daily messages

---

## 📧 Email Configuration

All answers and date requests are sent to:
- **Email**: terrell.flautt@gmail.com
- **Service**: Web3Forms
- **Access Key**: eafc242f-6c42-4d16-9253-28c7b6969aa7

Email formats:
- **Answers**: Question ID, puzzle name, answer text, timestamp
- **Date Requests**: Formatted with urgency, place, date/time, notes

---

## 🔧 Maintenance & Updates

### Update the Site Content

1. Make changes to the source code
2. Rebuild: `npm run build`
3. Redeploy: `./infrastructure/deploy-secure.sh`

The script automatically invalidates the CloudFront cache.

### View Stored Answers

Access the DynamoDB table:
```bash
aws dynamodb scan --table-name milas-world-answers
```

Or use the AWS Console:
https://console.aws.amazon.com/dynamodb

### Monitor Costs

Expected monthly costs (light usage):
- **S3**: ~$0.50/month
- **CloudFront**: ~$1-3/month
- **Lambda**: Free tier (up to 1M requests)
- **DynamoDB**: Free tier (up to 25GB storage)
- **Total**: ~$2-5/month

### Tear Down (If Needed)

To delete everything:
```bash
aws cloudformation delete-stack --stack-name milas-world-secure --region us-east-1
```

**Warning**: This will delete all data permanently.

---

## 🐛 Troubleshooting

### Issue: SSL Certificate Pending

**Solution**: Check your email for AWS Certificate Manager verification link. Click it to verify domain ownership.

### Issue: 403 Forbidden Error

**Solution**: This is intentional! The site is private. Enter the flamingo password.

### Issue: CloudFront Returns Cached Old Version

**Solution**: Run cache invalidation manually:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Issue: Emails Not Arriving

**Solution**:
1. Check spam folder
2. Verify Web3Forms access key is correct
3. Check Lambda CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/milas-world-answer-handler --follow
   ```

### Issue: DNS Not Resolving

**Solution**:
1. Verify CNAME record is correct
2. Wait longer (DNS can take up to 48 hours, usually <30 min)
3. Test with: `nslookup mila.terrellflautt.com`
4. Try different DNS server: `nslookup mila.terrellflautt.com 8.8.8.8`

---

## 🎯 Testing Checklist

Before sharing with Mila, verify:

- [ ] Site loads at https://mila.terrellflautt.com
- [ ] Security gate appears first
- [ ] Wrong password shows POOF effect and redirects to Google
- [ ] Correct password ("flamingo") shows bird animation
- [ ] Act I puzzles work on mobile and desktop
- [ ] Act II puzzles load correctly
- [ ] Answers arrive at terrell.flautt@gmail.com
- [ ] Date request form works
- [ ] Daily message system shows different content each day
- [ ] All animations are smooth (60fps)
- [ ] Site works on iPhone Safari
- [ ] Site works on Chrome/Firefox
- [ ] HTTPS certificate is valid (green lock icon)
- [ ] No console errors in browser DevTools

---

## 📱 Mobile Optimization

The site is fully mobile-optimized:
- Touch gestures for all interactions
- Reduced particle counts on mobile
- One-hand usable interface
- Responsive typography
- Optimized asset loading
- 60fps animations maintained

---

## 🎪 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Internet                         │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           CloudFront Distribution                    │
│         (HTTPS Only, OAI Enforced)                  │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│  Private S3  │      │   API Gateway     │
│    Bucket    │      │   (Serverless)    │
└──────────────┘      └─────────┬─────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐      ┌──────────────┐
            │   Lambda     │      │  DynamoDB    │
            │  Functions   │      │  (Encrypted) │
            └──────┬───────┘      └──────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  Web3Forms   │
            │   (Email)    │
            └──────────────┘
```

---

## 💝 Final Notes

This is a love letter written in code. Every animation, every puzzle, every word was crafted to make Mila feel:

- **Curious** - What's behind each curtain?
- **Seen** - Questions that reflect who she really is
- **Valued** - The time and artistry invested
- **Special** - An experience unlike anything else on the internet

The security isn't just about privacy—it's about creating a secret world that only she can enter. A digital space that exists just for her.

Make it good. Make her smile. 💕

---

**Stack Name**: milas-world-secure
**Region**: us-east-1
**Password**: flamingo
**Email**: terrell.flautt@gmail.com

**Status**: Ready for deployment ✨
